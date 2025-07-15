import type { Tenant } from '../../domain/entities/tenant.entity.js'
import type { IBaseRepository, IBaseService } from '../../shared/interfaces/base.interfaces.js'
import type { CreateTenantDto, UpdateTenantDto } from './tenant.dto.js'

export interface ITenantRepository
  extends IBaseRepository<Tenant, CreateTenantDto, UpdateTenantDto> {
  create(data: CreateTenantDto, createdBy?: string, permissions?: string[]): Promise<Tenant>
  findBySlug(slug: string): Promise<Tenant | null>
  findByApiKey(apiKey: string): Promise<Tenant | null>
  updateSubscription(id: string, plan: string): Promise<Tenant>
  incrementUsage(id: string, metric: string, amount: number): Promise<void>
}

export interface ITenantService extends IBaseService<Tenant, CreateTenantDto, UpdateTenantDto> {
  create(dto: CreateTenantDto, createdBy?: string): Promise<Tenant>
  findBySlug(slug: string): Promise<Tenant>
  updateSubscription(id: string, plan: string): Promise<Tenant>
  trackUsage(id: string, metric: string, amount: number): Promise<void>
  generateApiKey(id: string): Promise<string>
}
