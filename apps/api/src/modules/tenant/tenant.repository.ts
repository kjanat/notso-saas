import { injectable } from 'tsyringe'

import { Tenant } from '../../domain/entities/tenant.entity.js'
import { ApiKey } from '../../domain/value-objects/api-key.value-object.js'
import { getDatabase } from '../../shared/database/index.js'

import type { CreateTenantDto, UpdateTenantDto } from './tenant.dto.js'
import type { ITenantRepository } from './tenant.interfaces.js'

@injectable()
export class TenantRepository implements ITenantRepository {
  private get db() {
    return getDatabase()
  }

  async create(data: CreateTenantDto): Promise<Tenant> {
    const apiKey = ApiKey.generate().value
    const tenant = Tenant.create(data.name, data.slug, apiKey, data.plan)

    const dbTenant = await this.db.tenant.create({
      data: {
        apiKey: tenant.apiKey,
        id: tenant.id,
        maxChatbots: tenant.maxChatbots,
        name: tenant.name,
        plan: tenant.subscriptionPlan,
        slug: tenant.slug,
      },
    })

    return Tenant.reconstitute(dbTenant.id, {
      apiKey: dbTenant.apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots: await this.getChatbotCount(dbTenant.id),
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots || 1,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.plan || 'free',
      updatedAt: dbTenant.updatedAt,
    })
  }

  async findById(id: string): Promise<Tenant | null> {
    const dbTenant = await this.db.tenant.findUnique({
      where: { id },
    })

    if (!dbTenant) return null

    const currentChatbots = await this.getChatbotCount(id)

    return Tenant.reconstitute(dbTenant.id, {
      apiKey: dbTenant.apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots || 1,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.plan || 'free',
      updatedAt: dbTenant.updatedAt,
    })
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const dbTenant = await this.db.tenant.findUnique({
      where: { slug },
    })

    if (!dbTenant) return null

    const currentChatbots = await this.getChatbotCount(dbTenant.id)

    return Tenant.reconstitute(dbTenant.id, {
      apiKey: dbTenant.apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots || 1,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.plan || 'free',
      updatedAt: dbTenant.updatedAt,
    })
  }

  async findByApiKey(apiKey: string): Promise<Tenant | null> {
    const dbTenant = await this.db.tenant.findFirst({
      where: { apiKey },
    })

    if (!dbTenant) return null

    const currentChatbots = await this.getChatbotCount(dbTenant.id)

    return Tenant.reconstitute(dbTenant.id, {
      apiKey: dbTenant.apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots || 1,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.plan || 'free',
      updatedAt: dbTenant.updatedAt,
    })
  }

  async count(filters?: Record<string, any>): Promise<number> {
    return this.db.tenant.count({
      where: filters,
    })
  }

  async findAll(filters?: Record<string, any>): Promise<Tenant[]> {
    const tenants = await this.db.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      where: filters,
    })

    return Promise.all(
      tenants.map(async dbTenant => {
        const currentChatbots = await this.getChatbotCount(dbTenant.id)
        return Tenant.reconstitute(dbTenant.id, {
          apiKey: dbTenant.apiKey,
          createdAt: dbTenant.createdAt,
          currentChatbots,
          isActive: dbTenant.isActive,
          maxChatbots: dbTenant.maxChatbots || 1,
          name: dbTenant.name,
          slug: dbTenant.slug,
          subscriptionPlan: dbTenant.plan || 'free',
          updatedAt: dbTenant.updatedAt,
        })
      })
    )
  }

  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const dbTenant = await this.db.tenant.update({
      data: {
        name: data.name,
        plan: data.plan,
      },
      where: { id },
    })

    const currentChatbots = await this.getChatbotCount(id)

    return Tenant.reconstitute(dbTenant.id, {
      apiKey: dbTenant.apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots || 1,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.plan || 'free',
      updatedAt: dbTenant.updatedAt,
    })
  }

  async updateSubscription(id: string, plan: string): Promise<Tenant> {
    const dbTenant = await this.db.tenant.update({
      data: { plan },
      where: { id },
    })

    const currentChatbots = await this.getChatbotCount(id)

    return Tenant.reconstitute(dbTenant.id, {
      apiKey: dbTenant.apiKey,
      createdAt: dbTenant.createdAt,
      currentChatbots,
      isActive: dbTenant.isActive,
      maxChatbots: dbTenant.maxChatbots || 1,
      name: dbTenant.name,
      slug: dbTenant.slug,
      subscriptionPlan: dbTenant.plan || 'free',
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
