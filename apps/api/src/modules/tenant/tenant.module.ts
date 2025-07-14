import { FastifyPluginAsync } from 'fastify'
import { container } from '../../shared/di/container.js'
import { TenantController } from './tenant.controller.js'
import { TenantService } from './tenant.service.js'
import { TenantRepository } from './tenant.repository.js'
import type { ITenantRepository, ITenantService } from './tenant.interfaces.js'

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
    schema: {
      body: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
    handler: tenantController.create.bind(tenantController),
  })

  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
    handler: tenantController.findOne.bind(tenantController),
  })

  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
        },
      },
    },
    handler: tenantController.findAll.bind(tenantController),
  })

  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          settings: { type: 'object' },
        },
      },
    },
    handler: tenantController.update.bind(tenantController),
  })
}
