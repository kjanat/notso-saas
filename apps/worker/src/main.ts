import { PrismaClient } from '@saas/database'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

import { logger } from './logger.js'
import { aiProcessor } from './processors/ai.processor.js'
import { tenantProcessor } from './processors/tenant.processor.js'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const subClient = redis.duplicate()
const prisma = new PrismaClient()

// Create queue for AI processing
const aiQueue = new Queue('ai-processing', {
  connection: redis,
})

async function startWorkers() {
  logger.info('Starting background workers...')

  // AI Processing Worker
  const aiWorker = new Worker('ai-processing', aiProcessor, {
    concurrency: 5,
    connection: redis,
  })

  aiWorker.on('completed', job => {
    logger.info(`AI job completed: ${job.id}`)
  })

  aiWorker.on('failed', (job, err) => {
    logger.error(`AI job failed: ${job?.id}`, err)
  })

  // Tenant Provisioning Worker
  const tenantWorker = new Worker('tenant-provisioning', tenantProcessor, {
    concurrency: 2,
    connection: redis,
  })

  tenantWorker.on('completed', job => {
    logger.info(`Tenant job completed: ${job.id}`)
  })

  tenantWorker.on('failed', (job, err) => {
    logger.error(`Tenant job failed: ${job?.id}`, err)
  })

  // Redis subscription for real-time messages
  subClient.subscribe('chat:messages')
  subClient.on('message', async (channel: string, message: string) => {
    if (channel === 'chat:messages') {
      try {
        const data = JSON.parse(message)
        logger.info('Received chat message from Redis', { conversationId: data.conversationId })

        // Add to AI processing queue
        await aiQueue.add('process-message', {
          chatbotId: data.chatbotId,
          conversationId: data.conversationId,
          message: data.message,
          sessionId: data.sessionId,
          timestamp: data.timestamp,
        })
      } catch (error) {
        logger.error('Failed to process Redis message:', error)
      }
    }
  })

  logger.info('Workers started successfully')
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down workers...')
  await subClient.disconnect()
  await redis.disconnect()
  await prisma.$disconnect()
  process.exit(0)
})

startWorkers().catch(err => {
  logger.error('Failed to start workers:', err)
  process.exit(1)
})
