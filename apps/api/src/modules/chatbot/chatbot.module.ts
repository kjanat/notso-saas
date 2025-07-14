import { FastifyPluginAsync } from 'fastify'

export const chatbotModule: FastifyPluginAsync = async fastify => {
  // TODO: Implement chatbot routes
  fastify.get('/', async () => ({ message: 'Chatbot module' }))
}
