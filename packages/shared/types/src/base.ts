/**
 * Base types and branded types for type safety
 */

// Brand type utility for nominal typing
export type Brand<K, T> = K & { __brand: T }

// Branded ID types for type safety
export type TenantId = Brand<string, 'TenantId'>
export type UserId = Brand<string, 'UserId'>
export type ChatbotId = Brand<string, 'ChatbotId'>
export type ConversationId = Brand<string, 'ConversationId'>
export type MessageId = Brand<string, 'MessageId'>
export type DeploymentKey = Brand<string, 'DeploymentKey'>
export type ApiKey = Brand<string, 'ApiKey'>
export type JobId = Brand<string, 'JobId'>

// Base entity interface
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// Timestamps interface
export interface Timestamps {
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// Result type for error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}