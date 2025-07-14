import { injectable } from 'tsyringe'
import type { IAIProvider, IAIProviderFactory } from './ai.interfaces.js'
import { OpenAIProvider } from './providers/openai.provider.js'
import { AnthropicProvider } from './providers/anthropic.provider.js'

@injectable()
export class AIProviderFactory implements IAIProviderFactory {
  private providers: Map<string, IAIProvider> = new Map()

  constructor() {
    // Initialize providers
    this.registerProvider('openai', new OpenAIProvider())
    this.registerProvider('anthropic', new AnthropicProvider())
  }

  create(provider: 'openai' | 'anthropic' | 'vertex'): IAIProvider {
    const instance = this.providers.get(provider)

    if (!instance) {
      throw new Error(
        `AI provider '${provider}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`
      )
    }

    return instance
  }

  private registerProvider(name: string, provider: IAIProvider): void {
    this.providers.set(name, provider)
  }
}
