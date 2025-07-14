import type { FastifyPluginAsync } from 'fastify'

export const analyticsModule: FastifyPluginAsync = async fastify => {
  // TODO: Implement analytics routes
  fastify.get('/', async () => ({ message: 'Analytics module' }))
}
