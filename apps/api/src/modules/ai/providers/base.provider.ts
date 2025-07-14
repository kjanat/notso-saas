import type { IAIProvider, IStreamResponse } from '../ai.interfaces.js'

export abstract class BaseAIProvider implements IAIProvider {
  abstract name: string

  abstract generateResponse(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
      model?: string
    }
  ): Promise<string | AsyncGenerator<IStreamResponse>>

  abstract embedText(text: string): Promise<number[]>

  estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  protected formatMessages(messages: Array<{ role: string; content: string }>): any {
    return messages
  }
}
