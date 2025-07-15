import { PrismaClient } from '@prisma/client'
import type { Job } from 'bullmq'
import { logger } from '../logger.js'

const prisma = new PrismaClient()

export async function tenantProcessor(job: Job) {
  const { tenantId, databaseName } = job.data

  logger.info('Processing tenant provisioning', { databaseName, tenantId })

  try {
    // In a real app, you would:
    // 1. Create tenant database
    // 2. Run migrations
    // 3. Set up default data
    // 4. Create default chatbot

    // For now, just simulate the work
    await new Promise(resolve => globalThis.setTimeout(resolve, 2000))

    // Update tenant status
    await prisma.tenant.update({
      data: {
        provisionedAt: new Date(),
        status: 'active',
      },
      where: { id: tenantId },
    })

    logger.info('Tenant provisioning completed', { tenantId })

    return { status: 'provisioned', tenantId }
  } catch (error) {
    logger.error('Tenant provisioning failed', error)
    throw error
  }
}
