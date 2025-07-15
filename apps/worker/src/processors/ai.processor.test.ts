import type { Job } from 'bullmq'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { aiProcessor } from './ai.processor'

// Mock fetch globally
global.fetch = vi.fn()
const mockFetch = global.fetch as ReturnType<typeof vi.fn>

describe('AI Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should process AI job and return response', async () => {
    const mockJob: Job = {
      data: {
        chatbotId: 'bot-123',
        conversationId: 'conv-123',
        message: 'Hello, how can I help?',
        sessionId: 'session-123',
      },
    } as Job

    // Mock chatbot config fetch
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        maxTokens: 500,
        model: 'gpt-4',
        provider: 'openai',
        systemPrompt: 'You are a helpful assistant',
        temperature: 0.7,
      }),
      ok: true,
    })

    // Mock AI service response
    mockFetch.mockResolvedValueOnce({
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        content: 'I can help you with that!',
        usage: {
          completionTokens: 5,
          promptTokens: 10,
          totalTokens: 15,
        },
      }),
      ok: true,
    })

    const result = await aiProcessor(mockJob)

    expect(result).toEqual({
      conversationId: 'conv-123',
      provider: 'openai',
      response: 'I can help you with that!',
      usage: {
        completionTokens: 5,
        promptTokens: 10,
        totalTokens: 15,
      },
    })

    // Verify fetch calls
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/chatbots/embed/bot-123')
  })

  it('should handle streaming responses', async () => {
    const mockJob: Job = {
      data: {
        chatbotId: 'bot-123',
        conversationId: 'conv-123',
        message: 'Stream test',
        sessionId: 'session-123',
      },
    } as Job

    // Mock chatbot config
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ provider: 'openai' }),
      ok: true,
    })

    // Create a mock streaming response
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n',
      'data: {"choices":[{"delta":{"content":"!"}}],"usage":{"totalTokens":10}}\n',
      'data: [DONE]\n',
    ]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)))
        controller.close()
      },
    })

    mockFetch.mockResolvedValueOnce({
      body: stream,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      ok: true,
    })

    const result = await aiProcessor(mockJob)

    expect(result.response).toBe('Hello world!')
    expect(result.usage).toEqual({ totalTokens: 10 })
  })
})
