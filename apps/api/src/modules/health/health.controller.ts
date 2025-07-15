import { PrismaClient } from '@saas/database'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { Redis } from 'ioredis'
import { inject, injectable } from 'tsyringe'
import { logger } from '../../shared/utils/logger.js'

@injectable()
export class HealthController {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject('Redis') private redis: Redis
  ) {}

  async check(request: FastifyRequest, reply: FastifyReply)
    const services: Record<string, string> = {}
    let overallStatus = 'healthy'

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`
      services.database = 'connected'
    } catch (error) {
      request.log.error('Worker health check failed:', error)
      request.log.error('Redis health check failed:', error)
      request.log.error('Database health check failed:', error)
      request.log ? request.log.error('Database health check failed:', error) : logger.error('Database health check failed:', error)
      request.log.error('Database health check failed:', error)
      services.database = 'disconnected'
      overallStatus = 'unhealthy'
    }

    // Check Redis
    try {
      await this.redis.ping()
      services.redis = 'connected'
    } catch (error) {
      request.log.error('Worker health check failed:', error)
      request.log.error('Redis health check failed:', error)
      request.log.error('Database health check failed:', error)
      request.log ? request.log.error('Redis health check failed:', error) : logger.error('Redis health check failed:', error)
      request.log.error('Redis health check failed:', error)
      services.redis = 'disconnected'
      overallStatus = 'unhealthy'
    }

    // Check if worker is running by checking Redis queue status
    try {
      const queuePrefix = process.env.QUEUE_PREFIX || 'bull'
      const queueName = process.env.AI_QUEUE_NAME || 'ai-processing'
      const aiQueueKey = `${queuePrefix}:${queueName}:meta`
      const exists = await this.redis.exists(aiQueueKey)
      services.worker = exists ? 'running' : 'unknown'
    } catch (error) {
      request.log.error('Worker health check failed:', error)
      request.log.error('Redis health check failed:', error)
      request.log.error('Database health check failed:', error)
      request.log ? request.log.warn('Worker health check failed:', error) : logger.warn('Worker health check failed:', error)
      request.log.error('Worker health check failed:', error)
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

  async ready(_request: FastifyRequest, reply: FastifyReply) {
    // Simple readiness check - if the API is responding, it's ready
    return reply.send({ ready: true })
  }

  async live(_request: FastifyRequest, reply: FastifyReply) {
    // Liveness check - if the API can process requests, it's alive
    return reply.send({ alive: true })
  }
}
