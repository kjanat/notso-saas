import { BaseAIProvider } from './base.provider.js'
import type { IStreamResponse } from '../ai.interfaces.js'
import { config } from '../../../config/index.js'

export class AnthropicProvider extends BaseAIProvider {
  name = 'anthropic'
  private apiKey: string
  private baseUrl = 'https://api.anthropic.com/v1'

  constructor() {
    super()
    this.apiKey = config.anthropicApiKey
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-3-opus-20240229',
        messages: this.formatMessages(messages),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
        stream: options?.stream || false,
      }),
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
    // Anthropic doesn't have a native embedding API
    // In production, you might want to use a different provider for embeddings
    throw new Error('Anthropic does not support text embeddings. Use OpenAI or another provider.')
  }

  protected formatMessages(messages: Array<{ role: string; content: string }>): any {
    // Anthropic requires a specific format
    return messages.map(msg => ({
      role: msg.role === 'system' ? 'assistant' : msg.role,
      content: msg.content,
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
                text: parsed.delta.text,
                isComplete: false,
              }
            } else if (parsed.type === 'message_stop') {
              yield {
                text: '',
                isComplete: true,
                usage: {
                  promptTokens: parsed.usage?.input_tokens || 0,
                  completionTokens: parsed.usage?.output_tokens || 0,
                  totalTokens:
                    (parsed.usage?.input_tokens || 0) + (parsed.usage?.output_tokens || 0),
                },
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
