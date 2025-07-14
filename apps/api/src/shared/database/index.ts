import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger.js'

let prisma: PrismaClient

export async function setupDatabase() {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  try {
    await prisma.$connect()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error('Failed to connect to database:', error)
    throw error
  }
}

export function getDatabase() {
  if (!prisma) {
    throw new Error('Database not initialized. Call setupDatabase() first.')
  }
  return prisma
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma?.$disconnect()
})
