import type { FastifyPluginAsync } from 'fastify'
import { container } from '../../shared/di/container.js'

import type { IAIService } from './ai.interfaces.js'
import { AIService } from './ai.service.js'

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
    handler: async (request: any) => {
      const { provider, messages, options } = request.body
      return aiService.generateResponse(provider, messages, options)
    },
    schema: {
      body: {
        properties: {
          messages: {
            items: {
              properties: {
                content: { type: 'string' },
                role: { type: 'string' },
              },
              required: ['role', 'content'],
              type: 'object',
            },
            type: 'array',
          },
          options: {
            properties: {
              maxTokens: { type: 'number' },
              model: { type: 'string' },
              stream: { type: 'boolean' },
              temperature: { type: 'number' },
            },
            type: 'object',
          },
          provider: { enum: ['openai', 'anthropic', 'vertex'] },
        },
        required: ['provider', 'messages'],
        type: 'object',
      },
    },
  })

  fastify.post('/embed', {
    handler: async (request: any) => {
      const { provider, text } = request.body
      return aiService.embedText(provider, text)
    },
    schema: {
      body: {
        properties: {
          provider: { enum: ['openai', 'anthropic', 'vertex'] },
          text: { type: 'string' },
        },
        required: ['provider', 'text'],
        type: 'object',
      },
    },
  })
}
