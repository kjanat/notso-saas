import { injectable } from 'tsyringe'
import { getDatabase } from '../../shared/database/index.js'
import { Prisma } from '@prisma/client'
import type { ITenantRepository } from './tenant.interfaces.js'
import type { CreateTenantDto, UpdateTenantDto } from './tenant.dto.js'
import { Tenant } from '../../domain/entities/tenant.entity.js'
import { ApiKey } from '../../domain/value-objects/api-key.value-object.js'

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
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        apiKey: tenant.apiKey,
        plan: tenant.subscriptionPlan,
        maxChatbots: tenant.maxChatbots,
      },
    })

    return Tenant.reconstitute(dbTenant.id, {
      name: dbTenant.name,
      slug: dbTenant.slug,
      apiKey: dbTenant.apiKey,
      subscriptionPlan: dbTenant.plan || 'free',
      maxChatbots: dbTenant.maxChatbots || 1,
      currentChatbots: await this.getChatbotCount(dbTenant.id),
      isActive: dbTenant.isActive,
      createdAt: dbTenant.createdAt,
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
      name: dbTenant.name,
      slug: dbTenant.slug,
      apiKey: dbTenant.apiKey,
      subscriptionPlan: dbTenant.plan || 'free',
      maxChatbots: dbTenant.maxChatbots || 1,
      currentChatbots,
      isActive: dbTenant.isActive,
      createdAt: dbTenant.createdAt,
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
      name: dbTenant.name,
      slug: dbTenant.slug,
      apiKey: dbTenant.apiKey,
      subscriptionPlan: dbTenant.plan || 'free',
      maxChatbots: dbTenant.maxChatbots || 1,
      currentChatbots,
      isActive: dbTenant.isActive,
      createdAt: dbTenant.createdAt,
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
      name: dbTenant.name,
      slug: dbTenant.slug,
      apiKey: dbTenant.apiKey,
      subscriptionPlan: dbTenant.plan || 'free',
      maxChatbots: dbTenant.maxChatbots || 1,
      currentChatbots,
      isActive: dbTenant.isActive,
      createdAt: dbTenant.createdAt,
      updatedAt: dbTenant.updatedAt,
    })
  }

  async findAll(filters?: Record<string, any>): Promise<Tenant[]> {
    const tenants = await this.db.tenant.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    })

    return Promise.all(
      tenants.map(async dbTenant => {
        const currentChatbots = await this.getChatbotCount(dbTenant.id)
        return Tenant.reconstitute(dbTenant.id, {
          name: dbTenant.name,
          slug: dbTenant.slug,
          apiKey: dbTenant.apiKey,
          subscriptionPlan: dbTenant.plan || 'free',
          maxChatbots: dbTenant.maxChatbots || 1,
          currentChatbots,
          isActive: dbTenant.isActive,
          createdAt: dbTenant.createdAt,
          updatedAt: dbTenant.updatedAt,
        })
      })
    )
  }

  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const dbTenant = await this.db.tenant.update({
      where: { id },
      data: {
        name: data.name,
        plan: data.plan,
      },
    })

    const currentChatbots = await this.getChatbotCount(id)

    return Tenant.reconstitute(dbTenant.id, {
      name: dbTenant.name,
      slug: dbTenant.slug,
      apiKey: dbTenant.apiKey,
      subscriptionPlan: dbTenant.plan || 'free',
      maxChatbots: dbTenant.maxChatbots || 1,
      currentChatbots,
      isActive: dbTenant.isActive,
      createdAt: dbTenant.createdAt,
      updatedAt: dbTenant.updatedAt,
    })
  }

  async updateSubscription(id: string, plan: string): Promise<Tenant> {
    const dbTenant = await this.db.tenant.update({
      where: { id },
      data: { plan },
    })

    const currentChatbots = await this.getChatbotCount(id)

    return Tenant.reconstitute(dbTenant.id, {
      name: dbTenant.name,
      slug: dbTenant.slug,
      apiKey: dbTenant.apiKey,
      subscriptionPlan: dbTenant.plan || 'free',
      maxChatbots: dbTenant.maxChatbots || 1,
      currentChatbots,
      isActive: dbTenant.isActive,
      createdAt: dbTenant.createdAt,
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
