import type {
  // TenantId, // Kept for future use
  SubscriptionPlan,
  SubscriptionTier,
  Tenant,
  TenantCreationRequest,
  TenantUsage,
} from '@saas/types'
import { generateTenantDatabaseName, ValidationError } from '@saas/utils'

export class TenantDomain {
  private static readonly SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
    enterprise: {
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
      limits: {
        apiCallsPerMinute: 1000,
        chatbots: -1, // unlimited
        conversationsPerMonth: -1,
        customAvatars: -1,
        storageGB: -1,
        teamMembers: -1,
      },
      tier: 'enterprise',
    },
    professional: {
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
      limits: {
        apiCallsPerMinute: 200,
        chatbots: 10,
        conversationsPerMonth: 10000,
        customAvatars: 5,
        storageGB: 50,
        teamMembers: 20,
      },
      tier: 'professional',
    },
    starter: {
      features: ['basic_chat', 'basic_analytics', 'custom_branding', 'api_access'],
      limits: {
        apiCallsPerMinute: 50,
        chatbots: 3,
        conversationsPerMonth: 1000,
        customAvatars: 1,
        storageGB: 10,
        teamMembers: 5,
      },
      tier: 'starter',
    },
    trial: {
      features: ['basic_chat', 'basic_analytics'],
      limits: {
        apiCallsPerMinute: 10,
        chatbots: 1,
        conversationsPerMonth: 100,
        customAvatars: 0,
        storageGB: 1,
        teamMembers: 2,
      },
      tier: 'trial',
    },
  }

  static getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
    return TenantDomain.SUBSCRIPTION_PLANS[tier]
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
    const plan = TenantDomain.getSubscriptionPlan(tenant.subscriptionPlan)
    return plan.features.includes(feature)
  }

  static isTrialExpired(tenant: Tenant): boolean {
    if (tenant.subscriptionStatus !== 'trial' || !tenant.trialEndsAt) {
      return false
    }
    return new Date() > tenant.trialEndsAt
  }

  static calculateUsageCost(usage: TenantUsage, tier: SubscriptionTier): number {
    const { aiApiCost, storageCost } = usage.costs
    const baseCost = TenantDomain.getBaseCost(tier)
    return baseCost + aiApiCost + storageCost
  }

  private static getBaseCost(tier: SubscriptionTier): number {
    const costs: Record<SubscriptionTier, number> = {
      enterprise: 499,
      professional: 99,
      starter: 29,
      trial: 0,
    }
    return costs[tier] || 0
  }
}
