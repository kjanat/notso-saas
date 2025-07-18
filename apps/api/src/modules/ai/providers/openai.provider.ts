import { config } from '../../../config/index.js'
import type { IStreamResponse } from '../ai.interfaces.js'
import { BaseAIProvider } from './base.provider.js'

export class OpenAIProvider extends BaseAIProvider {
  name = 'openai'
  private apiKey: string
  private baseUrl = 'https://api.openai.com/v1'

  constructor() {
    super()
    this.apiKey = config.openaiApiKey
  }

  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
      model?: string
    }
  ): Promise<string | AsyncGenerator<IStreamResponse>> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      body: JSON.stringify({
        max_tokens: options?.maxTokens || 2000,
        messages: this.formatMessages(messages),
        model: options?.model || 'gpt-4',
        stream: options?.stream || false,
        temperature: options?.temperature || 0.7,
      }),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    if (options?.stream) {
      return this.handleStream(response)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async embedText(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  }

  private async *handleStream(response: Response): AsyncGenerator<IStreamResponse> {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            yield { isComplete: true, text: '' }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ''
            yield {
              isComplete: false,
              text: content,
              usage: parsed.usage,
            }
          } catch {
            // Skip invalid JSON chunks during streaming
            // In production, you might want to log this to a monitoring service
          }
        }
      }
    }
  }
}
