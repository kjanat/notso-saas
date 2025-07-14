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
  fastify.get('/embed/:embedId', {
    handler: chatbotController.findByEmbedId.bind(chatbotController),
    schema: {
      params: {
        properties: {
          embedId: { type: 'string' },
        },
        required: ['embedId'],
        type: 'object',
      },
    },
  })

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
    protectedRoutes.get('/', chatbotController.findAllByTenant.bind(chatbotController))

    protectedRoutes.post('/', {
      handler: chatbotController.create.bind(chatbotController),
      schema: {
        body: {
          properties: {
            animationMap: { type: 'object' },
            avatarModelUrl: { type: 'string' },
            avatarPosition: { type: 'object' },
            avatarScale: { type: 'number' },
            behaviors: { type: 'object' },
            description: { type: 'string' },
            knowledgeBaseId: { type: 'string' },
            maxTokens: { type: 'number' },
            model: { type: 'string' },
            name: { type: 'string' },
            placement: { type: 'object' },
            systemPrompt: { type: 'string' },
            temperature: { type: 'number' },
            theme: { type: 'object' },
            welcomeMessage: { type: 'string' },
          },
          required: ['name'],
          type: 'object',
        },
      },
    })

    protectedRoutes.get('/:id', {
      handler: chatbotController.findById.bind(chatbotController),
      schema: {
        params: {
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
          type: 'object',
        },
      },
    })

    protectedRoutes.patch('/:id', {
      handler: chatbotController.update.bind(chatbotController),
      schema: {
        body: {
          properties: {
            animationMap: { type: 'object' },
            avatarModelUrl: { type: 'string' },
            avatarPosition: { type: 'object' },
            avatarScale: { type: 'number' },
            behaviors: { type: 'object' },
            description: { type: 'string' },
            knowledgeBaseId: { type: 'string' },
            maxTokens: { type: 'number' },
            model: { type: 'string' },
            name: { type: 'string' },
            placement: { type: 'object' },
            systemPrompt: { type: 'string' },
            temperature: { type: 'number' },
            theme: { type: 'object' },
            welcomeMessage: { type: 'string' },
          },
          type: 'object',
        },
        params: {
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
          type: 'object',
        },
      },
    })

    protectedRoutes.delete('/:id', {
      handler: chatbotController.delete.bind(chatbotController),
      schema: {
        params: {
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
          type: 'object',
        },
      },
    })

    protectedRoutes.get('/:id/embed-script', {
      handler: chatbotController.getEmbedScript.bind(chatbotController),
      schema: {
        params: {
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
          type: 'object',
        },
      },
    })
  })
}
