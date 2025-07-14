import { BaseAIProvider } from './base.provider.js'
import type { IStreamResponse } from '../ai.interfaces.js'
import { config } from '../../../config/index.js'

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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4',
        messages: this.formatMessages(messages),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
        stream: options?.stream || false,
      }),
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
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
            yield { text: '', isComplete: true }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ''
            yield {
              text: content,
              isComplete: false,
              usage: parsed.usage,
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
