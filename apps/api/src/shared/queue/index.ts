import { Queue, Worker, QueueEvents } from 'bullmq'
import Redis from 'ioredis'
import { config } from '../../config/index.js'
import { logger } from '../utils/logger.js'

const queues = new Map<string, Queue>()
const workers = new Map<string, Worker>()

export async function setupQueues() {
  // Create Redis connection for BullMQ
  const connection = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  })

  // Create main queues
  const queueNames = ['ai-processing', 'email', 'analytics', 'file-processing']

  for (const name of queueNames) {
    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
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
  async addJob<T>(queueName: string, jobName: string, data: T, options?: any) {
    const queue = getQueue(queueName)
    const job = await queue.add(jobName, data, options)
    logger.debug(`Job ${jobName} added to queue ${queueName}`, { jobId: job.id })
    return job
  }

  registerWorker<T>(queueName: string, processor: (job: any) => Promise<T>) {
    const connection = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    })

    const worker = new Worker(queueName, processor, {
      connection,
      concurrency: 5,
    })

    worker.on('completed', job => {
      logger.debug(`Job ${job.name} completed`, { jobId: job.id })
    })

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.name} failed`, { jobId: job?.id, error: err.message })
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
