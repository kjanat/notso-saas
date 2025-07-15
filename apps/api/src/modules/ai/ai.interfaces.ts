export interface IStreamResponse {
  text?: string
  isComplete?: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  choices?: Array<{
    delta: {
      content?: string
    }
    finishReason?: string | null
  }>
}

export interface IChatRequest {
  messages: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
  model?: string
}

export interface IChatResponse {
  content: string
  finishReason: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export type FormattedMessage = Array<{ role: string; content: string }>

export interface IAIProvider {
  name: string
  generateResponse(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
      model?: string
    }
  ): Promise<string | AsyncGenerator<IStreamResponse>>

  embedText(text: string): Promise<number[]>

  estimateTokens(text: string): number
}

export interface IAIProviderFactory {
  create(provider: 'openai' | 'anthropic' | 'vertex'): IAIProvider
}

export interface IAIService {
  generateResponse(
    provider: 'openai' | 'anthropic' | 'vertex',
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
      model?: string
    }
  ): Promise<string | AsyncGenerator<IStreamResponse>>

  embedText(provider: 'openai' | 'anthropic' | 'vertex', text: string): Promise<number[]>

  estimateTokens(provider: 'openai' | 'anthropic' | 'vertex', text: string): number
}
