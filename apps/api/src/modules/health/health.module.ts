import type { FastifyPluginAsync } from 'fastify'
import { container } from '../../shared/di/container.js'
import { HealthController } from './health.controller.js'

export const healthModule: FastifyPluginAsync = async fastify => {
  const healthController = container.resolve(HealthController)

  // Main health check with all service statuses
  fastify.get('/', {
    handler: healthController.check.bind(healthController),
    schema: {
      response: {
        200: {
          properties: {
            environment: { type: 'string' },
            services: {
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' },
                worker: { type: 'string' },
              },
              type: 'object',
            },
            status: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' },
          },
          type: 'object',
        },
        503: {
          properties: {
            environment: { type: 'string' },
            services: { type: 'object' },
            status: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' },
          },
          type: 'object',
        },
      },
    },
  })

  // Kubernetes readiness probe
  fastify.get('/ready', {
    handler: healthController.ready.bind(healthController),
  })

  // Kubernetes liveness probe
  fastify.get('/live', {
    handler: healthController.live.bind(healthController),
  })
}
