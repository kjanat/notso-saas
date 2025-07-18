import type { Tenant } from '@saas/domain'
import type { IBaseRepository, IBaseService } from '../../shared/interfaces/base.interfaces.js'
import type { CreateTenantDto, UpdateTenantDto } from './tenant.dto.js'

export interface ITenantRepository
  extends IBaseRepository<Tenant, CreateTenantDto, UpdateTenantDto> {
  findBySlug(slug: string): Promise<Tenant | null>
  findByApiKey(apiKey: string): Promise<Tenant | null>
  updateSubscription(id: string, plan: string): Promise<Tenant>
  incrementUsage(id: string, metric: string, amount: number): Promise<void>
}

export interface ITenantService extends IBaseService<Tenant, CreateTenantDto, UpdateTenantDto> {
  findBySlug(slug: string): Promise<Tenant>
  updateSubscription(id: string, plan: string): Promise<Tenant>
  trackUsage(id: string, metric: string, amount: number): Promise<void>
  generateApiKey(id: string): Promise<string>
}
