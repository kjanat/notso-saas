import { PrismaClient } from '@saas/database'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { Redis } from 'ioredis'
import { injectable } from 'tsyringe'

@injectable()
export class HealthController {
  private prisma: PrismaClient
  private redis: Redis

  constructor() {
    this.prisma = new PrismaClient()
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  }

  async check(request: FastifyRequest, reply: FastifyReply) {
    const services: Record<string, string> = {}
    let overallStatus = 'healthy'

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`
      services.database = 'connected'
    } catch {
      services.database = 'disconnected'
      overallStatus = 'unhealthy'
    }

    // Check Redis
    try {
      await this.redis.ping()
      services.redis = 'connected'
    } catch {
      services.redis = 'disconnected'
      overallStatus = 'unhealthy'
    }

    // Check if worker is running by checking Redis queue status
    try {
      const aiQueueKey = 'bull:ai-processing:meta'
      const exists = await this.redis.exists(aiQueueKey)
      services.worker = exists ? 'running' : 'unknown'
    } catch {
      services.worker = 'error'
    }

    const response = {
      environment: process.env.NODE_ENV || 'development',
      services,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    }

    return reply.status(overallStatus === 'healthy' ? 200 : 503).send(response)
  }

  async ready(request: FastifyRequest, reply: FastifyReply) {
    // Simple readiness check - if the API is responding, it's ready
    return reply.send({ ready: true })
  }

  async live(request: FastifyRequest, reply: FastifyReply) {
    // Liveness check - if the API can process requests, it's alive
    return reply.send({ alive: true })
  }
}
