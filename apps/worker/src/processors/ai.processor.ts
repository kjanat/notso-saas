import type { Job } from 'bullmq'

import { Redis } from 'ioredis'

import { logger } from '../logger.js'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const pubClient = redis.duplicate()

interface ChatbotContext {
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export async function aiProcessor(job: Job) {
  const { conversationId, message, chatbotId, sessionId } = job.data

  logger.info('Processing AI job', { chatbotId, conversationId, sessionId })

  // Fetch chatbot configuration
  let context: ChatbotContext = {}
  let provider = 'openai'

  try {
    const chatbotResponse = await fetch(`http://localhost:3000/chatbots/embed/${chatbotId}`)
    if (chatbotResponse.ok) {
      const chatbot = await chatbotResponse.json()
      context = {
        maxTokens: chatbot.maxTokens,
        model: chatbot.model,
        systemPrompt: chatbot.systemPrompt,
        temperature: chatbot.temperature,
      }
      provider = chatbot.provider || 'openai'
    }
  } catch (error) {
    logger.error('Failed to fetch chatbot config:', error)
  }

  try {
    // Call AI service endpoint
    const response = await fetch('http://localhost:3000/ai/generate', {
      body: JSON.stringify({
        messages: [
          {
            content: context.systemPrompt || 'You are a helpful assistant.',
            role: 'system',
          },
          {
            content: message,
            role: 'user',
          },
        ],
        options: {
          maxTokens: context.maxTokens || 500,
          model: context.model || 'gpt-4-turbo-preview',
          stream: true,
          temperature: context.temperature || 0.7,
        },
        provider,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`)
    }

    let fullResponse = ''
    let usage = null

    if (response.headers.get('content-type')?.includes('event-stream')) {
      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const chunk = JSON.parse(data)

              // Extract content from chunk
              const content = chunk.choices?.[0]?.delta?.content || ''
              if (content) {
                fullResponse += content

                // Publish chunk to Redis for WebSocket
                await pubClient.publish(
                  'chat:messages',
                  JSON.stringify({
                    content,
                    conversationId,
                    timestamp: new Date().toISOString(),
                    type: 'stream',
                  })
                )
              }

              // Extract usage from final chunk
              if (chunk.usage) {
                usage = chunk.usage
              }
            } catch (err) {
              logger.error('Failed to parse streaming chunk:', err)
            }
          }
        }
      }
    } else {
      // Handle non-streaming response
      const data = await response.json()
      fullResponse = data.content
      usage = data.usage
    }

    // Save to database
    // TODO: Implement database save with Prisma
    logger.info('AI response generated', {
      conversationId,
      responseLength: fullResponse.length,
      usage,
    })

    // Send final message via WebSocket
    await pubClient.publish(
      'chat:messages',
      JSON.stringify({
        content: fullResponse,
        conversationId,
        timestamp: new Date().toISOString(),
        type: 'complete',
        usage,
      })
    )

    return {
      conversationId,
      provider,
      response: fullResponse,
      usage,
    }
  } catch (error) {
    logger.error('AI processing failed', error)

    // Notify error via WebSocket
    await pubClient.publish(
      'chat:messages',
      JSON.stringify({
        conversationId,
        error: error instanceof Error ? error.message : 'AI processing failed',
        timestamp: new Date().toISOString(),
        type: 'error',
      })
    )

    throw error
  }
}
