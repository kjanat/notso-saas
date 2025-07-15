import type { FastifyPluginAsync } from 'fastify'
import { container } from '../../shared/di/container.js'
import { ChatbotController } from './chatbot.controller.js'
import type { IChatbotRepository, IChatbotService } from './chatbot.interfaces.js'
import { ChatbotRepository } from './chatbot.repository.js'
import { ChatbotService } from './chatbot.service.js'

export const chatbotModule: FastifyPluginAsync = async fastify => {
  // Register dependencies
  container.registerSingleton<IChatbotRepository>('IChatbotRepository', ChatbotRepository)
  container.registerSingleton<IChatbotService>('IChatbotService', ChatbotService)

  const chatbotService = container.resolve<IChatbotService>('IChatbotService')
  const chatbotController = new ChatbotController(chatbotService)

  // Public routes
  fastify.get('/embed/:embedId', chatbotController.findByEmbedId.bind(chatbotController) as any)

  // Protected routes
  fastify.register(async protectedRoutes => {
    // Add authentication preHandler
    protectedRoutes.addHook('preHandler', async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    })

    // CRUD routes
    protectedRoutes.get('/', chatbotController.findAllByTenant.bind(chatbotController) as any)

    protectedRoutes.post('/', chatbotController.create.bind(chatbotController) as any)

    protectedRoutes.get('/:id', chatbotController.findById.bind(chatbotController) as any)

    protectedRoutes.patch('/:id', chatbotController.update.bind(chatbotController) as any)

    protectedRoutes.delete('/:id', chatbotController.delete.bind(chatbotController) as any)

    protectedRoutes.get(
      '/:id/embed-script',
      chatbotController.getEmbedScript.bind(chatbotController) as any
    )
  })
}
