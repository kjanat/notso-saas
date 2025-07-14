import { FastifyPluginAsync } from 'fastify'

export const conversationModule: FastifyPluginAsync = async fastify => {
  // TODO: Implement conversation routes
  fastify.get('/', async () => ({ message: 'Conversation module' }))
}
