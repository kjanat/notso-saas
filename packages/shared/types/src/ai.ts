/**
 * AI/ML processing types
 */

import type { ConversationId, JobId, MessageId, TenantId } from './base'

export interface AIJob {
  id: JobId
  tenantId: TenantId
  conversationId?: ConversationId
  messageId?: MessageId
  type: AIJobType
  status: AIJobStatus
  priority: number // 1-10, higher = more priority
  payload: AIJobPayload
  result?: AIJobResult
  error?: AIJobError
  metadata: {
    retryCount: number
    costEstimate?: number
    actualCost?: number
    processingTime?: number
    model?: string
    provider?: AIProvider
  }
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

export type AIJobType =
  | 'chat_response'
  | 'sentiment_analysis'
  | 'intent_classification'
  | 'entity_extraction'
  | 'summarization'
  | 'batch_processing'
  | 'embedding_generation'

export type AIJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'azure' | 'local'

export interface AIJobPayload {
  content: string
  context?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  chatbotConfig?: {
    model: string
    temperature: number
    maxTokens: number
    systemPrompt?: string
    personality?: string
  }
  options?: Record<string, any>
}

export interface AIJobResult {
  content?: string
  sentiment?: SentimentAnalysis
  intent?: IntentResult
  entities?: EntityExtraction[]
  embedding?: number[]
  metadata?: Record<string, any>
}

export interface AIJobError {
  code: string
  message: string
  provider?: AIProvider
  retryable: boolean
  retryAfter?: number
}

export interface SentimentAnalysis {
  score: number // -1 to 1
  confidence: number // 0 to 1
  label: 'positive' | 'neutral' | 'negative'
  emotions?: {
    joy?: number
    sadness?: number
    anger?: number
    fear?: number
    surprise?: number
    disgust?: number
  }
}

export interface IntentResult {
  intent: string
  confidence: number
  alternativeIntents?: Array<{
    intent: string
    confidence: number
  }>
}

export interface EntityExtraction {
  type: string
  value: string
  confidence: number
  startIndex?: number
  endIndex?: number
}

// Cost tracking
export interface AIUsageMetrics {
  tenantId: TenantId
  provider: AIProvider
  model: string
  period: Date
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    totalTokens: number
    inputTokens: number
    outputTokens: number
    totalCost: number
    averageLatency: number
    cacheHitRate: number
  }
}

export interface AIModelConfig {
  provider: AIProvider
  model: string
  endpoint?: string
  apiKey?: string
  maxTokens: number
  temperature: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  timeout?: number
  retryAttempts?: number
}

// Rate limiting
export interface AIRateLimit {
  tenantId: TenantId
  limits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
    tokensPerMinute: number
    tokensPerHour: number
    tokensPerDay: number
    costPerDay: number
    costPerMonth: number
  }
  currentUsage?: {
    requests: number
    tokens: number
    cost: number
    resetAt: Date
  }
}
