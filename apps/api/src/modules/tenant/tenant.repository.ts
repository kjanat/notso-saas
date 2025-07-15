import { createHash } from 'node:crypto'
import type { Prisma, SubscriptionTier } from '@saas/database'
import { injectable } from 'tsyringe'
import { v4 as uuidv4 } from 'uuid'

import { Tenant } from '../../domain/entities/tenant.entity.js'
import { ApiKey } from '../../domain/value-objects/api-key.value-object.js'
import { getDatabase } from '../../shared/database/index.js'

import type { CreateTenantDto, TenantFilters, UpdateTenantDto } from './tenant.dto.js'
import type { ITenantRepository } from './tenant.interfaces.js'

@injectable()
export class TenantRepository implements ITenantRepository {
  private get db() {
    return getDatabase()
  }

  async create(
    data: CreateTenantDto,
    createdBy = 'system',
    permissions: string[] = ['*']
  ): Promise<Tenant> {
    const apiKey = ApiKey.generate().value
    const subscriptionPlan = data.plan || 'TRIAL'
    const maxChatbots = this.getMaxChatbotsForPlan(subscriptionPlan)

    // Create tenant with UUID v4
    const tenantId = uuidv4()

    const dbTenant = await this.db.tenant.create({
      data: {
        databaseName: `db_${data.slug.replace(/-/g, '_')}`,
        id: tenantId,
        isActive: true,
        maxChatbots,
        name: data.name,
        slug: data.slug,
        subscriptionPlan: subscriptionPlan.toUpperCase() as any,
      },
    })

    // Create the initial API key for this tenant
    const hashedKey = await this.hashApiKey(apiKey)
    await this.db.apiKey.create({
      data: {
        createdBy,
        keyHash: hashedKey,
        name: 'Default API Key',
        permissions,
        tenantId: dbTenant.id,
      },
    })

    return Tenant.reconstitute(dbTenant.id, {
      apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots: 0,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.subscriptionPlan.toLowerCase(),
      updatedAt: dbTenant.updatedAt,
    })
  }

  private getMaxChatbotsForPlan(plan: string): number {
    const planLimits: Record<string, number> = {
      enterprise: 100,
      professional: 10,
      starter: 3,
      trial: 1,
    }
    return planLimits[plan.toLowerCase()] || 1
  }

  private async hashApiKey(key: string): Promise<string> {
    // Use SHA-256 for secure one-way hashing
    return createHash('sha256').update(key).digest('hex')
  }

  async findById(id: string): Promise<Tenant | null> {
    const dbTenant = await this.db.tenant.findUnique({
      include: {
        apiKeys: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      where: { id },
    })

    if (!dbTenant) return null

    const currentChatbots = await this.getChatbotCount(id)
    // Hide API key - never expose the actual key
    const apiKey = 'hidden'

    return Tenant.reconstitute(dbTenant.id, {
      apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.subscriptionPlan.toLowerCase(),
      updatedAt: dbTenant.updatedAt,
    })
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const dbTenant = await this.db.tenant.findUnique({
      include: {
        apiKeys: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      where: { slug },
    })

    if (!dbTenant) return null

    const currentChatbots = await this.getChatbotCount(dbTenant.id)
    // Hide API key - never expose the actual key
    const apiKey = 'hidden'

    return Tenant.reconstitute(dbTenant.id, {
      apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.subscriptionPlan.toLowerCase(),
      updatedAt: dbTenant.updatedAt,
    })
  }

  async findByApiKey(apiKey: string): Promise<Tenant | null> {
    const hashedKey = await this.hashApiKey(apiKey)
    const apiKeyRecord = await this.db.apiKey.findUnique({
      include: { tenant: true },
      where: { keyHash: hashedKey },
    })

    if (!apiKeyRecord || !apiKeyRecord.tenant) return null

    const dbTenant = apiKeyRecord.tenant

    const currentChatbots = await this.getChatbotCount(dbTenant.id)

    return Tenant.reconstitute(dbTenant.id, {
      apiKey, // Use the original unhashed key
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.subscriptionPlan.toLowerCase(),
      updatedAt: dbTenant.updatedAt,
    })
  }

  async count(filters?: TenantFilters): Promise<number> {
    return this.db.tenant.count({
      where: filters,
    })
  }

  async findAll(filters?: TenantFilters): Promise<Tenant[]> {
    const tenants = await this.db.tenant.findMany({
      include: {
        apiKeys: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      where: filters,
    })

    return Promise.all(
      tenants.map(async dbTenant => {
        const currentChatbots = await this.getChatbotCount(dbTenant.id)
        // Hide API key - never expose the actual key
        const apiKey = 'hidden'
        return Tenant.reconstitute(dbTenant.id, {
          apiKey,
          createdAt: dbTenant.createdAt,
          currentChatbots,
          isActive: dbTenant.isActive,
          maxChatbots: dbTenant.maxChatbots,
          name: dbTenant.name,
          slug: dbTenant.slug,
          subscriptionPlan: dbTenant.subscriptionPlan.toLowerCase(),
          updatedAt: dbTenant.updatedAt,
        })
      })
    )
  }

  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const updateData: Prisma.TenantUpdateInput = {}
    if (data.name) updateData.name = data.name
    if (data.plan) {
      updateData.subscriptionPlan = data.plan.toUpperCase() as SubscriptionTier
      updateData.maxChatbots = this.getMaxChatbotsForPlan(data.plan)
    }

    const dbTenant = await this.db.tenant.update({
      data: updateData,
      include: {
        apiKeys: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      where: { id },
    })

    const currentChatbots = await this.getChatbotCount(id)
    // Hide API key - never expose the actual key
    const apiKey = 'hidden'

    return Tenant.reconstitute(dbTenant.id, {
      apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots || 1,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.subscriptionPlan.toLowerCase(),
      updatedAt: dbTenant.updatedAt,
    })
  }

  async updateSubscription(id: string, plan: string): Promise<Tenant> {
    const dbTenant = await this.db.tenant.update({
      data: {
        maxChatbots: this.getMaxChatbotsForPlan(plan),
        subscriptionPlan: plan.toUpperCase() as SubscriptionTier,
      },
      include: {
        apiKeys: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      where: { id },
    })

    const currentChatbots = await this.getChatbotCount(id)
    // Hide API key - never expose the actual key
    const apiKey = 'hidden'

    return Tenant.reconstitute(dbTenant.id, {
      apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.subscriptionPlan.toLowerCase(),
      updatedAt: dbTenant.updatedAt,
    })
  }

  async incrementUsage(id: string, metric: string, amount: number): Promise<void> {
    // In a real implementation, this would update usage metrics
    // For now, this is a placeholder
    await this.db.$executeRaw`
      INSERT INTO usage_metrics (tenant_id, metric, amount, date)
      VALUES (${id}, ${metric}, ${amount}, CURRENT_DATE)
      ON CONFLICT (tenant_id, metric, date)
      DO UPDATE SET amount = usage_metrics.amount + ${amount}
    `
  }

  async delete(id: string): Promise<void> {
    await this.db.tenant.delete({
      where: { id },
    })
  }

  private async getChatbotCount(tenantId: string): Promise<number> {
    return this.db.chatbot.count({
      where: { tenantId },
    })
  }
}
