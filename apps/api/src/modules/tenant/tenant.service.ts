import { injectable, inject } from 'tsyringe'
import type { ITenantRepository, ITenantService } from './tenant.interfaces.js'
import type { CreateTenantDto, UpdateTenantDto } from './tenant.dto.js'
import type {
  ICacheService,
  IQueueService,
  ILogger,
} from '../../shared/interfaces/base.interfaces.js'
import { Tenant } from '../../domain/entities/tenant.entity.js'

@injectable()
export class TenantService implements ITenantService {
  constructor(
    @inject('ITenantRepository') private readonly repository: ITenantRepository,
    @inject('ICacheService') private readonly cache: ICacheService,
    @inject('IQueueService') private readonly queue: IQueueService,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    // Check if slug already exists
    const existing = await this.repository.findBySlug(dto.slug)
    if (existing) {
      throw new Error('Tenant slug already exists')
    }

    // Create tenant using domain model
    const tenant = await this.repository.create(dto)

    // Queue provisioning job
    await this.queue.addJob('tenant-provisioning', 'provision-database', {
      tenantId: tenant.id,
      slug: tenant.slug,
    })

    // Clear events after persisting
    tenant.clearEvents()

    this.logger.info('Tenant created', { tenantId: tenant.id, slug: tenant.slug })
    return tenant
  }

  async findById(id: string): Promise<Tenant> {
    // Try cache first
    const cacheKey = `tenant:${id}`
    const cached = await this.cache.get<Tenant>(cacheKey)
    if (cached) {
      // Reconstitute domain model from cached data
      return Tenant.reconstitute(cached.id, cached as any)
    }

    // Fetch from database
    const tenant = await this.repository.findById(id)
    if (!tenant) {
      throw new Error(`Tenant not found: ${id}`)
    }

    // Cache the serialized tenant data
    await this.cache.set(
      cacheKey,
      {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        apiKey: tenant.apiKey,
        subscriptionPlan: tenant.subscriptionPlan,
        maxChatbots: tenant.maxChatbots,
        currentChatbots: tenant.currentChatbots,
        isActive: tenant.isActive,
      },
      300
    ) // Cache for 5 minutes

    return tenant
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.repository.findBySlug(slug)
    if (!tenant) {
      throw new Error(`Tenant not found with slug: ${slug}`)
    }
    return tenant
  }

  async findAll(filters?: Record<string, any>): Promise<Tenant[]> {
    return this.repository.findAll(filters)
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.repository.update(id, dto)

    // Invalidate cache
    await this.cache.delete(`tenant:${id}`)

    return tenant
  }

  async updateSubscription(id: string, plan: string): Promise<Tenant> {
    const tenant = await this.repository.findById(id)
    if (!tenant) {
      throw new Error(`Tenant not found: ${id}`)
    }

    // Use domain method to update subscription
    tenant.updateSubscription(plan)

    // Persist changes
    const updated = await this.repository.updateSubscription(id, plan)

    // Process domain events
    for (const event of tenant.domainEvents) {
      await this.queue.addJob('domain-events', event.eventName, event)
    }

    // Clear events and cache
    tenant.clearEvents()
    await this.cache.delete(`tenant:${id}`)

    return updated
  }

  async trackUsage(id: string, metric: string, amount: number): Promise<void> {
    await this.repository.incrementUsage(id, metric, amount)

    // Queue analytics job
    await this.queue.addJob('analytics', 'track-usage', {
      tenantId: id,
      metric,
      amount,
      timestamp: new Date(),
    })
  }

  async generateApiKey(id: string): Promise<string> {
    const tenant = await this.repository.findById(id)
    if (!tenant) {
      throw new Error(`Tenant not found: ${id}`)
    }

    // Use domain method to regenerate API key
    const newApiKey = tenant.regenerateApiKey()

    // Persist changes
    await this.repository.update(id, { apiKey: newApiKey })

    // Process domain events
    for (const event of tenant.domainEvents) {
      await this.queue.addJob('domain-events', event.eventName, event)
    }

    // Clear events and cache
    tenant.clearEvents()
    await this.cache.delete(`tenant:${id}`)

    return newApiKey
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
    await this.cache.delete(`tenant:${id}`)
  }
}
