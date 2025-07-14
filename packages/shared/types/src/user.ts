/**
 * User and authentication types
 */

import type { BaseEntity, TenantId, UserId } from './base'

export type UserRole = 'platform_admin' | 'tenant_admin' | 'tenant_user' | 'tenant_viewer'

export interface User extends BaseEntity {
  id: UserId
  email: string
  name: string
  avatarUrl?: string
  isActive: boolean
  emailVerified: boolean
  lastLoginAt?: Date
  preferences: UserPreferences
  metadata: Record<string, any>
}

export interface TenantUser {
  userId: UserId
  tenantId: TenantId
  role: UserRole
  permissions: Permission[]
  joinedAt: Date
  invitedBy?: UserId
}

export interface UserPreferences {
  language: string
  timezone: string
  notifications: {
    email: boolean
    inApp: boolean
    conversationAlerts: boolean
    systemAlerts: boolean
    marketingEmails: boolean
  }
  theme?: 'light' | 'dark' | 'system'
}

export interface Permission {
  resource: ResourceType
  action: ActionType
  scope?: 'own' | 'team' | 'all'
}

export type ResourceType =
  | 'chatbot'
  | 'conversation'
  | 'user'
  | 'team'
  | 'analytics'
  | 'billing'
  | 'settings'
  | 'api_key'

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'export' | 'invite' | 'manage'

// Authentication types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export interface LoginRequest {
  email: string
  password: string
  tenantSlug?: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  company?: string
  tenantName: string
  tenantSlug: string
}

export interface JWTPayload {
  userId: UserId
  email: string
  tenantId?: TenantId
  role?: UserRole
  permissions?: Permission[]
  sessionId: string
  iat: number
  exp: number
}

// API Key types
export interface ApiKey {
  id: string
  tenantId: TenantId
  name: string
  keyHash: string
  permissions: Permission[]
  lastUsedAt?: Date
  expiresAt?: Date
  createdBy: UserId
  isActive: boolean
}

export interface CreateApiKeyRequest {
  name: string
  permissions: Permission[]
  expiresAt?: Date
}

export interface ApiKeyResponse {
  id: string
  name: string
  key: string // Only returned on creation
  permissions: Permission[]
  expiresAt?: Date
}
