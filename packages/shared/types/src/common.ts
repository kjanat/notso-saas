/**
 * Common utility types and enums
 */

import type { DynamicConfig, DynamicValue, EntityMetadata, ResponseMetadata } from './shared'

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

export type DeepReadonly<T> = T extends object ? { readonly [P in keyof T]: DeepReadonly<T[P]> } : T

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

// Pagination
export interface PaginationParams {
  page: number
  limit: number
  sort?: SortParams
}

export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: ResponseMetadata
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  stack?: string
}

// Validation
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: DynamicValue
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// File upload
export interface FileUpload {
  filename: string
  mimeType: string
  size: number
  buffer?: Buffer
  stream?: ReadableStream
  url?: string
}

// Queue job types
export interface QueueJob<T = unknown> {
  id: string
  queue: string
  type: string
  data: T
  attempts: number
  maxAttempts: number
  createdAt: Date
  processedAt?: Date
  completedAt?: Date
  failedAt?: Date
  error?: string
}

// Event emitter types
export interface EventPayload<T = unknown> {
  event: string
  data: T
  timestamp: Date
  source: string
}

// Cache types
export interface CacheEntry<T = unknown> {
  key: string
  value: T
  ttl?: number
  expiresAt?: Date
}

// Feature flags
export interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPercentage?: number
  enabledForTenants?: string[]
  metadata?: DynamicConfig
}

// Health check
export interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  uptime: number
  checks: HealthCheck[]
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message?: string
  duration?: number
  metadata?: Record<string, string | number | boolean>
}

// Audit log
export interface AuditLog {
  id: string
  tenantId?: string
  userId?: string
  action: string
  resource: string
  resourceId: string
  changes?: {
    before: Record<string, DynamicValue>
    after: Record<string, DynamicValue>
  }
  metadata?: EntityMetadata
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

// Webhook
export interface WebhookEvent {
  id: string
  type: string
  data: Record<string, unknown>
  timestamp: Date
  signature?: string
}

export interface WebhookConfig {
  url: string
  events: string[]
  secret?: string
  headers?: Record<string, string>
  retryPolicy?: {
    maxAttempts: number
    backoffMultiplier: number
    maxBackoffSeconds: number
  }
}

// Environment
export type Environment = 'development' | 'staging' | 'production'

// Locale
export type Locale =
  | 'en-US'
  | 'es-ES'
  | 'fr-FR'
  | 'de-DE'
  | 'it-IT'
  | 'pt-BR'
  | 'ja-JP'
  | 'zh-CN'
  | 'ko-KR'

// Currency
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'INR' | 'BRL'

// Time zones
export type TimeZone = string // IANA time zone identifier

// Common regex patterns
export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneNumber: /^\+?[1-9]\d{1,14}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const
