import type {
  AIJob,
  AIJobType,
  AIModelConfig,
  AIProvider,
  AIRateLimit,
  AIUsageMetrics,
} from '@saas/types'
import { ConfigurationError, RateLimitError } from '@saas/utils'

export class AIProcessingDomain {
  private static readonly PROVIDER_COSTS: Record<
    AIProvider,
    Record<string, { input: number; output: number }>
  > = {
    anthropic: {
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
    },
    azure: {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-35-turbo': { input: 0.0005, output: 0.0015 },
    },
    google: {
      'gemini-pro': { input: 0.00025, output: 0.0005 },
      'gemini-pro-vision': { input: 0.00025, output: 0.0005 },
    },
    local: {
      llama2: { input: 0, output: 0 },
      mistral: { input: 0, output: 0 },
    },
    openai: {
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
    },
  }

  private static readonly JOB_PRIORITIES: Record<AIJobType, number> = {
    batch_processing: 2,
    chat_response: 10,
    embedding_generation: 3,
    entity_extraction: 6,
    intent_classification: 8,
    sentiment_analysis: 8,
    summarization: 4,
  }

  static getJobPriority(jobType: AIJobType): number {
    return AIProcessingDomain.JOB_PRIORITIES[jobType] || 5
  }

  static estimateCost(
    provider: AIProvider,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const costs = AIProcessingDomain.PROVIDER_COSTS[provider]?.[model]
    if (!costs) {
      throw new ConfigurationError(`Unknown model ${model} for provider ${provider}`)
    }

    const inputCost = (inputTokens / 1000) * costs.input
    const outputCost = (outputTokens / 1000) * costs.output

    return Number((inputCost + outputCost).toFixed(6))
  }

  static estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  static checkRateLimit(
    currentUsage: AIRateLimit['currentUsage'],
    limits: AIRateLimit['limits']
  ): void {
    if (!currentUsage) return

    const now = new Date()
    const resetTime = new Date(currentUsage.resetAt)

    if (now > resetTime) {
      // Rate limit window has reset
      return
    }

    if (currentUsage.requests >= limits.requestsPerMinute) {
      const waitTime = Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
      throw new RateLimitError('AI API request rate limit exceeded', waitTime, {
        current: currentUsage.requests,
        limit: limits.requestsPerMinute,
      })
    }

    if (currentUsage.tokens >= limits.tokensPerMinute) {
      const waitTime = Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
      throw new RateLimitError('AI API token rate limit exceeded', waitTime, {
        current: currentUsage.tokens,
        limit: limits.tokensPerMinute,
      })
    }

    if (currentUsage.cost >= limits.costPerDay) {
      throw new RateLimitError('Daily AI API cost limit exceeded', undefined, {
        current: currentUsage.cost,
        limit: limits.costPerDay,
      })
    }
  }

  static getDefaultModelConfig(provider: AIProvider): AIModelConfig {
    const configs: Record<AIProvider, AIModelConfig> = {
      anthropic: {
        maxTokens: 1024,
        model: 'claude-3-haiku',
        provider: 'anthropic',
        retryAttempts: 3,
        temperature: 0.7,
        timeout: 30000,
        topP: 1,
      },
      azure: {
        frequencyPenalty: 0,
        maxTokens: 1024,
        model: 'gpt-35-turbo',
        presencePenalty: 0,
        provider: 'azure',
        retryAttempts: 3,
        temperature: 0.7,
        timeout: 30000,
        topP: 1,
      },
      google: {
        maxTokens: 1024,
        model: 'gemini-pro',
        provider: 'google',
        retryAttempts: 3,
        temperature: 0.7,
        timeout: 30000,
        topP: 1,
      },
      local: {
        endpoint: 'http://localhost:11434',
        maxTokens: 2048,
        model: 'llama2',
        provider: 'local',
        retryAttempts: 2,
        temperature: 0.7,
        timeout: 60000,
      },
      openai: {
        frequencyPenalty: 0,
        maxTokens: 1024,
        model: 'gpt-3.5-turbo',
        presencePenalty: 0,
        provider: 'openai',
        retryAttempts: 3,
        temperature: 0.7,
        timeout: 30000,
        topP: 1,
      },
    }

    return configs[provider]
  }

  static calculateRetryDelay(attempt: number, baseDelay = 1000): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * 2 ** (attempt - 1)
    const jitter = Math.random() * 1000
    return Math.min(exponentialDelay + jitter, 60000) // Max 60 seconds
  }

  static shouldRetryJob(job: AIJob): boolean {
    if (job.status !== 'failed' || !job.error) {
      return false
    }

    if (!job.error.retryable) {
      return false
    }

    const maxRetries = 3
    if (job.metadata.retryCount >= maxRetries) {
      return false
    }

    return true
  }

  static aggregateUsageMetrics(metrics: AIUsageMetrics[]): AIUsageMetrics['metrics'] {
    const aggregated = metrics.reduce(
      (acc, curr) => ({
        averageLatency: 0, // Will calculate after
        cacheHitRate: 0, // Will calculate after
        failedRequests: acc.failedRequests + curr.metrics.failedRequests,
        inputTokens: acc.inputTokens + curr.metrics.inputTokens,
        outputTokens: acc.outputTokens + curr.metrics.outputTokens,
        successfulRequests: acc.successfulRequests + curr.metrics.successfulRequests,
        totalCost: acc.totalCost + curr.metrics.totalCost,
        totalRequests: acc.totalRequests + curr.metrics.totalRequests,
        totalTokens: acc.totalTokens + curr.metrics.totalTokens,
      }),
      {
        averageLatency: 0,
        cacheHitRate: 0,
        failedRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
        successfulRequests: 0,
        totalCost: 0,
        totalRequests: 0,
        totalTokens: 0,
      }
    )

    // Calculate weighted average latency
    const totalLatency = metrics.reduce(
      (sum, curr) => sum + curr.metrics.averageLatency * curr.metrics.totalRequests,
      0
    )
    aggregated.averageLatency =
      aggregated.totalRequests > 0 ? totalLatency / aggregated.totalRequests : 0

    // Calculate average cache hit rate
    const totalCacheHits = metrics.reduce(
      (sum, curr) => sum + curr.metrics.cacheHitRate * curr.metrics.totalRequests,
      0
    )
    aggregated.cacheHitRate =
      aggregated.totalRequests > 0 ? totalCacheHits / aggregated.totalRequests : 0

    return aggregated
  }

  static generateCacheKey(job: AIJob): string {
    const { type, payload } = job
    const { chatbotConfig } = payload
    const configKey = chatbotConfig
      ? `${chatbotConfig.model}_${chatbotConfig.temperature}`
      : 'default'

    const contentHash = AIProcessingDomain.simpleHash(payload.content)

    return `ai_cache:${job.tenantId}:${type}:${configKey}:${contentHash}`
  }

  private static simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}
