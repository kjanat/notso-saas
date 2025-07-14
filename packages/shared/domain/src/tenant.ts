import { ValidationError, generateTenantDatabaseName } from '@saas/utils'

import type {
  Tenant,
  // TenantId, // Kept for future use
  SubscriptionPlan,
  SubscriptionTier,
  TenantCreationRequest,
  TenantUsage,
} from '@saas/types'

export class TenantDomain {
  private static readonly SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
    trial: {
      tier: 'trial',
      limits: {
        chatbots: 1,
        conversationsPerMonth: 100,
        teamMembers: 2,
        customAvatars: 0,
        apiCallsPerMinute: 10,
        storageGB: 1,
      },
      features: ['basic_chat', 'basic_analytics'],
    },
    starter: {
      tier: 'starter',
      limits: {
        chatbots: 3,
        conversationsPerMonth: 1000,
        teamMembers: 5,
        customAvatars: 1,
        apiCallsPerMinute: 50,
        storageGB: 10,
      },
      features: ['basic_chat', 'basic_analytics', 'custom_branding', 'api_access'],
    },
    professional: {
      tier: 'professional',
      limits: {
        chatbots: 10,
        conversationsPerMonth: 10000,
        teamMembers: 20,
        customAvatars: 5,
        apiCallsPerMinute: 200,
        storageGB: 50,
      },
      features: [
        'basic_chat',
        'basic_analytics',
        'custom_branding',
        'api_access',
        'advanced_analytics',
        '3d_avatars',
        'sentiment_analysis',
        'webhooks',
      ],
    },
    enterprise: {
      tier: 'enterprise',
      limits: {
        chatbots: -1, // unlimited
        conversationsPerMonth: -1,
        teamMembers: -1,
        customAvatars: -1,
        apiCallsPerMinute: 1000,
        storageGB: -1,
      },
      features: [
        'basic_chat',
        'basic_analytics',
        'custom_branding',
        'api_access',
        'advanced_analytics',
        '3d_avatars',
        'sentiment_analysis',
        'webhooks',
        'custom_ai_models',
        'sla_support',
        'dedicated_resources',
      ],
    },
  }

  static getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
    return this.SUBSCRIPTION_PLANS[tier]
  }

  static validateTenantCreation(request: TenantCreationRequest): void {
    if (!request.slug || request.slug.length < 3) {
      throw new ValidationError('Tenant slug must be at least 3 characters')
    }

    if (!request.name || request.name.length < 2) {
      throw new ValidationError('Tenant name must be at least 2 characters')
    }

    if (!request.adminEmail || !request.adminEmail.includes('@')) {
      throw new ValidationError('Valid admin email is required')
    }
  }

  static generateDatabaseName(tenantSlug: string): string {
    return generateTenantDatabaseName(tenantSlug)
  }

  static calculateTrialEndDate(): Date {
    const date = new Date()
    date.setDate(date.getDate() + 14) // 14-day trial
    return date
  }

  static isWithinLimits(usage: Partial<TenantUsage['metrics']>, plan: SubscriptionPlan): boolean {
    const metrics = usage as TenantUsage['metrics']

    if (
      plan.limits.conversationsPerMonth !== -1 &&
      metrics.activeChats > plan.limits.conversationsPerMonth
    ) {
      return false
    }

    if (
      plan.limits.apiCallsPerMinute !== -1 &&
      metrics.aiApiCalls > plan.limits.apiCallsPerMinute * 60
    ) {
      return false
    }

    if (plan.limits.storageGB !== -1 && metrics.storageUsedGB > plan.limits.storageGB) {
      return false
    }

    return true
  }

  static canAccessFeature(tenant: Tenant, feature: string): boolean {
    const plan = this.getSubscriptionPlan(tenant.subscriptionPlan)
    return plan.features.includes(feature)
  }

  static isTrialExpired(tenant: Tenant): boolean {
    if (tenant.subscriptionStatus !== 'trial' || !tenant.trialEndsAt) {
      return false
    }
    return new Date() > tenant.trialEndsAt
  }

  static calculateUsageCost(usage: TenantUsage): number {
    const { aiApiCost, storageCost } = usage.costs
    const baseCost = this.getBaseCost(usage.tenantId as any)
    return baseCost + aiApiCost + storageCost
  }

  private static getBaseCost(tier: SubscriptionTier): number {
    const costs: Record<SubscriptionTier, number> = {
      trial: 0,
      starter: 29,
      professional: 99,
      enterprise: 499,
    }
    return costs[tier] || 0
  }
}
