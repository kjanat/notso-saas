import { config } from '../../../config/index.js'
import type { IStreamResponse } from '../ai.interfaces.js'
import { BaseAIProvider } from './base.provider.js'

export class AnthropicProvider extends BaseAIProvider {
  name = 'anthropic'
  private apiKey: string
  private voyageApiKey: string
  private baseUrl = 'https://api.anthropic.com/v1'
  private voyageUrl = 'https://api.voyageai.com/v1'

  constructor() {
    super()
    this.apiKey = config.ai.anthropic.apiKey || ''
    this.voyageApiKey = config.ai.voyage.apiKey || ''
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
    const response = await fetch(`${this.baseUrl}/messages`, {
      body: JSON.stringify({
        max_tokens: options?.maxTokens || 2000,
        messages: this.formatMessages(messages),
        model: options?.model || 'claude-3-opus-20240229',
        stream: options?.stream || false,
        temperature: options?.temperature || 0.7,
      }),
      headers: {
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    if (options?.stream) {
      return this.handleStream(response)
    }

    const data = await response.json()
    return data.content[0].text
  }

  async embedText(text: string): Promise<number[]> {
    // Use Voyage AI for embeddings as recommended by Anthropic
    if (!this.voyageApiKey) {
      throw new Error('Voyage API key not configured. Set VOYAGE_API_KEY environment variable.')
    }

    const response = await fetch(`${this.voyageUrl}/embeddings`, {
      body: JSON.stringify({
        input: text,
        model: 'voyage-large-2', // 1536 dimensions, best for general use
      }),
      headers: {
        Authorization: `Bearer ${this.voyageApiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Voyage API error: ${response.statusText} - ${error}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  }

  protected formatMessages(messages: Array<{ role: string; content: string }>): any {
    // Anthropic requires a specific format
    return messages.map(msg => ({
      content: msg.content,
      role: msg.role === 'system' ? 'assistant' : msg.role,
    }))
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

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'content_block_delta') {
              yield {
                isComplete: false,
                text: parsed.delta.text,
              }
            } else if (parsed.type === 'message_stop') {
              yield {
                isComplete: true,
                text: '',
                usage: {
                  completionTokens: parsed.usage?.output_tokens || 0,
                  promptTokens: parsed.usage?.input_tokens || 0,
                  totalTokens:
                    (parsed.usage?.input_tokens || 0) + (parsed.usage?.output_tokens || 0),
                },
              }
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
