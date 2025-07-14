/**
 * Tenant-related types and interfaces
 */

import type { BaseEntity, TenantId, Timestamps } from './base'

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'suspended'
export type SubscriptionTier = 'trial' | 'starter' | 'professional' | 'enterprise'

export interface SubscriptionPlan {
  tier: SubscriptionTier
  limits: {
    chatbots: number
    conversationsPerMonth: number
    teamMembers: number
    customAvatars: number
    apiCallsPerMinute: number
    storageGB: number
  }
  features: string[]
}

export interface Tenant extends BaseEntity {
  id: TenantId
  slug: string
  name: string
  databaseName: string
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionTier
  trialEndsAt?: Date
  metadata: Record<string, any>
  settings: TenantSettings
}

export interface TenantSettings {
  branding?: {
    primaryColor?: string
    logo?: string
    favicon?: string
  }
  security: {
    allowedDomains: string[]
    ipWhitelist?: string[]
    enforceSSO?: boolean
  }
  features: {
    enableLegacyImport: boolean
    enable3DAvatars: boolean
    enableAnalytics: boolean
    enableWebhooks: boolean
  }
}

export interface TenantCreationRequest {
  slug: string
  name: string
  adminEmail: string
  adminName: string
  company?: string
  subscriptionTier?: SubscriptionTier
}

export interface TenantUsage {
  tenantId: TenantId
  period: Date
  metrics: {
    activeChats: number
    totalMessages: number
    aiApiCalls: number
    storageUsedGB: number
    activeUsers: number
  }
  costs: {
    aiApiCost: number
    storageCost: number
    totalCost: number
  }
}