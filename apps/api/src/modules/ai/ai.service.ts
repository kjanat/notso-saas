import { injectable, inject } from 'tsyringe'
import type { IAIService, IAIProviderFactory, IStreamResponse } from './ai.interfaces.js'
import type { ILogger } from '../../shared/interfaces/base.interfaces.js'

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
        provider,
        model: options?.model,
        messageCount: messages.length,
      })

      return response
    } catch (error) {
      this.logger.error('Failed to generate AI response', error as Error, {
        provider,
        model: options?.model,
      })
      throw error
    }
  }

  async embedText(provider: 'openai' | 'anthropic' | 'vertex', text: string): Promise<number[]> {
    try {
      const aiProvider = this.providerFactory.create(provider)
      const embedding = await aiProvider.embedText(text)

      this.logger.info('Text embedded', {
        provider,
        textLength: text.length,
        embeddingDimensions: embedding.length,
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
