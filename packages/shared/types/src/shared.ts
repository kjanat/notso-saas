/**
 * Shared types to replace any usage across the codebase
 */

// Common metadata type that can be extended for specific use cases
export interface BaseMetadata {
  [key: string]: string | number | boolean | Date | null | undefined | string[]
}

// More specific metadata types for different contexts
export interface EventMetadata extends BaseMetadata {
  source?: string
  userAgent?: string
  ipAddress?: string
  sessionId?: string
  timestamp?: Date
}

export interface EntityMetadata extends BaseMetadata {
  version?: number
  lastModifiedBy?: string
  lastModifiedAt?: Date
  tags?: string[]
  isDeleted?: boolean
}

export interface ResponseMetadata extends BaseMetadata {
  requestId?: string
  duration?: number
  cached?: boolean
  apiVersion?: string
}

// Generic value type for form data and other dynamic content
export type DynamicValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | DynamicValue[]
  | { [key: string]: DynamicValue }

// Configuration object types
export interface DynamicConfig {
  [key: string]: string | number | boolean | string[] | DynamicConfig
}

// Alert action configurations
export interface EmailAlertConfig {
  to: string[]
  cc?: string[]
  subject?: string
  template?: string
}

export interface WebhookAlertConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT'
  headers?: Record<string, string>
  retryAttempts?: number
}

export interface SlackAlertConfig {
  webhookUrl: string
  channel?: string
  username?: string
  iconEmoji?: string
}

export interface SmsAlertConfig {
  phoneNumbers: string[]
  provider?: 'twilio' | 'aws-sns'
}

export type AlertConfig = EmailAlertConfig | WebhookAlertConfig | SlackAlertConfig | SmsAlertConfig
