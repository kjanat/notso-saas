import type { FastifyPluginAsync } from 'fastify'
import { container } from '../../shared/di/container.js'
import { TenantController } from './tenant.controller.js'
import type { ITenantRepository, ITenantService } from './tenant.interfaces.js'
import { TenantRepository } from './tenant.repository.js'
import { TenantService } from './tenant.service.js'

export const tenantModule: FastifyPluginAsync = async fastify => {
  // Register tenant-specific dependencies
  container.registerSingleton<ITenantRepository>('ITenantRepository', TenantRepository)
  container.registerSingleton<ITenantService>('ITenantService', TenantService)

  // Resolve controller with all dependencies injected
  const tenantController = container.resolve(TenantController)

  // Decorate fastify instance with services
  fastify.decorate('tenantService', container.resolve<ITenantService>('ITenantService'))

  // Register routes
  fastify.post('/', {
    handler: tenantController.create.bind(tenantController),
    schema: {
      body: {
        properties: {
          email: { format: 'email', type: 'string' },
          name: { type: 'string' },
          slug: { pattern: '^[a-z0-9-]+$', type: 'string' },
        },
        required: ['name', 'slug'],
        type: 'object',
      },
      response: {
        201: {
          properties: {
            createdAt: { type: 'string' },
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
          type: 'object',
        },
      },
    },
  })

  fastify.get('/:id', {
    handler: tenantController.findOne.bind(tenantController),
    schema: {
      params: {
        properties: {
          id: { type: 'string' },
        },
        type: 'object',
      },
    },
  })

  fastify.get('/', {
    handler: tenantController.findAll.bind(tenantController),
    schema: {
      querystring: {
        properties: {
          limit: { default: 10, type: 'number' },
          page: { default: 1, type: 'number' },
        },
        type: 'object',
      },
    },
  })

  fastify.patch('/:id', {
    handler: tenantController.update.bind(tenantController),
    schema: {
      body: {
        properties: {
          name: { type: 'string' },
          settings: { type: 'object' },
        },
        type: 'object',
      },
      params: {
        properties: {
          id: { type: 'string' },
        },
        type: 'object',
      },
    },
  })
}
