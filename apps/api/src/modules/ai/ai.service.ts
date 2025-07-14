import { inject, injectable } from 'tsyringe'
import type { ILogger } from '../../shared/interfaces/base.interfaces.js'
import type { IAIProviderFactory, IAIService, IStreamResponse } from './ai.interfaces.js'

@injectable()
export class AIService implements IAIService {
  constructor(
    @inject('IAIProviderFactory') private readonly providerFactory: IAIProviderFactory,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  async generateResponse(
    provider: 'openai' | 'anthropic' | 'vertex',
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
      model?: string
    }
  ): Promise<string | AsyncGenerator<IStreamResponse>> {
    try {
      const aiProvider = this.providerFactory.create(provider)
      const response = await aiProvider.generateResponse(messages, options)

      this.logger.info('AI response generated', {
        messageCount: messages.length,
        model: options?.model,
        provider,
      })

      return response
    } catch (error) {
      this.logger.error('Failed to generate AI response', error as Error, {
        model: options?.model,
        provider,
      })
      throw error
    }
  }

  async embedText(provider: 'openai' | 'anthropic' | 'vertex', text: string): Promise<number[]> {
    try {
      const aiProvider = this.providerFactory.create(provider)
      const embedding = await aiProvider.embedText(text)

      this.logger.info('Text embedded', {
        embeddingDimensions: embedding.length,
        provider,
        textLength: text.length,
      })

      return embedding
    } catch (error) {
      this.logger.error('Failed to embed text', error as Error, { provider })
      throw error
    }
  }

  estimateTokens(provider: 'openai' | 'anthropic' | 'vertex', text: string): number {
    const aiProvider = this.providerFactory.create(provider)
    return aiProvider.estimateTokens(text)
  }
}
