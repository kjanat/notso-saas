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

  interface GenerateBody {
    provider: 'openai' | 'anthropic' | 'vertex'
    messages: Array<{ role: string; content: string }>
    options?: {
      stream?: boolean
      model?: string
      temperature?: number
      maxTokens?: number
    }
  }

  fastify.post<{ Body: GenerateBody }>('/generate', {
    handler: async (request, reply) => {
      const { provider, messages, options } = request.body

      // Handle streaming responses
      if (options?.stream) {
        reply.type('text/event-stream')
        reply.header('Cache-Control', 'no-cache')
        reply.header('Connection', 'keep-alive')
        reply.header('X-Accel-Buffering', 'no')

        const stream = await aiService.generateResponse(provider, messages, options)

        for await (const chunk of stream) {
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`)
        }

        reply.raw.write('data: [DONE]\n\n')
        reply.raw.end()
        return
      }

      // Non-streaming response
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

  interface EmbedBody {
    provider: 'openai' | 'anthropic' | 'vertex'
    text: string
  }

  fastify.post<{ Body: EmbedBody }>('/embed', {
    handler: async request => {
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
