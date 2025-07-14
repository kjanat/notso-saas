import type { Job } from 'bullmq'
import OpenAI from 'openai'
import { logger } from '../logger.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function aiProcessor(job: Job) {
  const { conversationId, message, chatbotId, context } = job.data

  logger.info('Processing AI job', { chatbotId, conversationId })

  try {
    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      max_tokens: 500,
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
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || ''

    // TODO: Save response to database
    // TODO: Send via WebSocket

    return {
      conversationId,
      model: 'gpt-4-turbo-preview',
      response,
      tokens: completion.usage,
    }
  } catch (error) {
    logger.error('AI processing failed', error)
    throw error
  }
}
