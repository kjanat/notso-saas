import { FastifyPluginAsync } from 'fastify'
import { container } from '../../shared/di/container.js'
import { AIService } from './ai.service.js'
import type { IAIService } from './ai.interfaces.js'

export const aiModule: FastifyPluginAsync = async fastify => {
  // Register AI service
  container.registerSingleton<IAIService>('IAIService', AIService)

  const aiService = container.resolve<IAIService>('IAIService')

  // Decorate fastify instance
  fastify.decorate('aiService', aiService)

  // AI routes
  fastify.get('/providers', async () => {
    return {
      providers: ['openai', 'anthropic', 'vertex'],
    }
  })

  fastify.post('/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['provider', 'messages'],
        properties: {
          provider: { enum: ['openai', 'anthropic', 'vertex'] },
          messages: {
            type: 'array',
            items: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
          options: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
              maxTokens: { type: 'number' },
              stream: { type: 'boolean' },
              model: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async (request: any) => {
      const { provider, messages, options } = request.body
      return aiService.generateResponse(provider, messages, options)
    },
  })

  fastify.post('/embed', {
    schema: {
      body: {
        type: 'object',
        required: ['provider', 'text'],
        properties: {
          provider: { enum: ['openai', 'anthropic', 'vertex'] },
          text: { type: 'string' },
        },
      },
    },
    handler: async (request: any) => {
      const { provider, text } = request.body
      return aiService.embedText(provider, text)
    },
  })
}
