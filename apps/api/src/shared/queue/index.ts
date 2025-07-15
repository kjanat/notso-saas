import type { Job, JobsOptions, Processor } from 'bullmq'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { config } from '../../config/index.js'
import { logger } from '../utils/logger.js'

const queues = new Map<string, Queue>()
const workers = new Map<string, Worker>()

export async function setupQueues() {
  // Create Redis connection for BullMQ
  const connection = new Redis(config.redis.url, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
  })

  // Create main queues
  const queueNames = ['ai-processing', 'email', 'analytics', 'file-processing']

  for (const name of queueNames) {
    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          delay: 2000,
          type: 'exponential',
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    })
    queues.set(name, queue)
  }

  logger.info('Queues initialized successfully')
}

export function getQueue(name: string): Queue {
  const queue = queues.get(name)
  if (!queue) {
    throw new Error(
      `Queue ${name} not found. Available queues: ${Array.from(queues.keys()).join(', ')}`
    )
  }
  return queue
}

export class QueueService {
  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<string> {
    const queue = getQueue(queueName)
    const job = await queue.add(jobName, data, options)
    logger.debug(`Job ${jobName} added to queue ${queueName}`, {
      jobId: job.id,
    })
    return job.id || ''
  }

  async removeJob(jobId: string): Promise<void> {
    // Since we don't know which queue the job belongs to, we need to check all queues
    for (const queue of queues.values()) {
      const job = await queue.getJob(jobId)
      if (job) {
        await job.remove()
        return
      }
    }
    logger.warn(`Job ${jobId} not found in any queue`)
  }

  async getJob(jobId: string): Promise<Job | null> {
    // Since we don't know which queue the job belongs to, we need to check all queues
    for (const queue of queues.values()) {
      const job = await queue.getJob(jobId)
      if (job) {
        return job
      }
    }
    return null
  }

  async getJobs(): Promise<Job[]> {
    const allJobs: Job[] = []
    for (const queue of queues.values()) {
      const jobs = await queue.getJobs()
      allJobs.push(...jobs)
    }
    return allJobs
  }

  registerWorker<T>(queueName: string, processor: Processor<T>) {
    const connection = new Redis(config.redis.url, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: null,
    })

    const worker = new Worker(queueName, processor, {
      concurrency: 5,
      connection,
    })

    worker.on('completed', job => {
      logger.debug(`Job ${job.name} completed`, { jobId: job.id })
    })

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.name} failed`, {
        error: err.message,
        jobId: job?.id,
      })
    })

    workers.set(queueName, worker)
    return worker
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  // Close all workers
  for (const [name, worker] of workers.entries()) {
    logger.info(`Closing worker: ${name}`)
    await worker.close()
  }

  // Close all queues
  for (const [name, queue] of queues.entries()) {
    logger.info(`Closing queue: ${name}`)
    await queue.close()
  }
})
