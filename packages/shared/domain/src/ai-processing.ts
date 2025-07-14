import { RateLimitError, ConfigurationError } from '@saas/utils'

import type {
  AIJob,
  AIJobType,
  AIProvider,
  AIModelConfig,
  AIRateLimit,
  AIUsageMetrics,
} from '@saas/types'

export class AIProcessingDomain {
  private static readonly PROVIDER_COSTS: Record<
    AIProvider,
    Record<string, { input: number; output: number }>
  > = {
    openai: {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    },
    anthropic: {
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    },
    google: {
      'gemini-pro': { input: 0.00025, output: 0.0005 },
      'gemini-pro-vision': { input: 0.00025, output: 0.0005 },
    },
    azure: {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-35-turbo': { input: 0.0005, output: 0.0015 },
    },
    local: {
      llama2: { input: 0, output: 0 },
      mistral: { input: 0, output: 0 },
    },
  }

  private static readonly JOB_PRIORITIES: Record<AIJobType, number> = {
    chat_response: 10,
    sentiment_analysis: 8,
    intent_classification: 8,
    entity_extraction: 6,
    summarization: 4,
    batch_processing: 2,
    embedding_generation: 3,
  }

  static getJobPriority(jobType: AIJobType): number {
    return this.JOB_PRIORITIES[jobType] || 5
  }

  static estimateCost(
    provider: AIProvider,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const costs = this.PROVIDER_COSTS[provider]?.[model]
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
        limit: limits.requestsPerMinute,
        current: currentUsage.requests,
      })
    }

    if (currentUsage.tokens >= limits.tokensPerMinute) {
      const waitTime = Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
      throw new RateLimitError('AI API token rate limit exceeded', waitTime, {
        limit: limits.tokensPerMinute,
        current: currentUsage.tokens,
      })
    }

    if (currentUsage.cost >= limits.costPerDay) {
      throw new RateLimitError('Daily AI API cost limit exceeded', undefined, {
        limit: limits.costPerDay,
        current: currentUsage.cost,
      })
    }
  }

  static getDefaultModelConfig(provider: AIProvider): AIModelConfig {
    const configs: Record<AIProvider, AIModelConfig> = {
      openai: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 1024,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        timeout: 30000,
        retryAttempts: 3,
      },
      anthropic: {
        provider: 'anthropic',
        model: 'claude-3-haiku',
        maxTokens: 1024,
        temperature: 0.7,
        topP: 1,
        timeout: 30000,
        retryAttempts: 3,
      },
      google: {
        provider: 'google',
        model: 'gemini-pro',
        maxTokens: 1024,
        temperature: 0.7,
        topP: 1,
        timeout: 30000,
        retryAttempts: 3,
      },
      azure: {
        provider: 'azure',
        model: 'gpt-35-turbo',
        maxTokens: 1024,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        timeout: 30000,
        retryAttempts: 3,
      },
      local: {
        provider: 'local',
        model: 'llama2',
        maxTokens: 2048,
        temperature: 0.7,
        endpoint: 'http://localhost:11434',
        timeout: 60000,
        retryAttempts: 2,
      },
    }

    return configs[provider]
  }

  static calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
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
        totalRequests: acc.totalRequests + curr.metrics.totalRequests,
        successfulRequests: acc.successfulRequests + curr.metrics.successfulRequests,
        failedRequests: acc.failedRequests + curr.metrics.failedRequests,
        totalTokens: acc.totalTokens + curr.metrics.totalTokens,
        inputTokens: acc.inputTokens + curr.metrics.inputTokens,
        outputTokens: acc.outputTokens + curr.metrics.outputTokens,
        totalCost: acc.totalCost + curr.metrics.totalCost,
        averageLatency: 0, // Will calculate after
        cacheHitRate: 0, // Will calculate after
      }),
      {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
        averageLatency: 0,
        cacheHitRate: 0,
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

    const contentHash = this.simpleHash(payload.content)

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
