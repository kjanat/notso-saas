import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { logger } from './logger.js'
import { aiProcessor } from './processors/ai.processor.js'
import { tenantProcessor } from './processors/tenant.processor.js'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const prisma = new PrismaClient()

async function startWorkers() {
  logger.info('Starting background workers...')

  // AI Processing Worker
  const aiWorker = new Worker('ai-processing', aiProcessor, {
    connection: redis,
    concurrency: 5,
  })

  aiWorker.on('completed', job => {
    logger.info(`AI job completed: ${job.id}`)
  })

  aiWorker.on('failed', (job, err) => {
    logger.error(`AI job failed: ${job?.id}`, err)
  })

  // Tenant Provisioning Worker
  const tenantWorker = new Worker('tenant-provisioning', tenantProcessor, {
    connection: redis,
    concurrency: 2,
  })

  tenantWorker.on('completed', job => {
    logger.info(`Tenant job completed: ${job.id}`)
  })

  tenantWorker.on('failed', (job, err) => {
    logger.error(`Tenant job failed: ${job?.id}`, err)
  })

  logger.info('Workers started successfully')
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down workers...')
  await prisma.$disconnect()
  process.exit(0)
})

startWorkers().catch(err => {
  logger.error('Failed to start workers:', err)
  process.exit(1)
})
