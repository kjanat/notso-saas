import type { FastifyReply, FastifyRequest } from 'fastify'
import { inject, injectable } from 'tsyringe'
import type { CreateTenantDto, UpdateTenantDto } from './tenant.dto.js'
import type { ITenantService } from './tenant.interfaces.js'

@injectable()
export class TenantController {
  constructor(@inject('ITenantService') private readonly tenantService: ITenantService) {}

  async create(request: FastifyRequest<{ Body: CreateTenantDto }>, reply: FastifyReply) {
    // Get user ID from JWT token if available, otherwise use 'system'
    const createdBy = request.user?.id || 'system'
    const tenant = await this.tenantService.create(request.body, createdBy)
    return reply.status(201).send(tenant)
  }

  async findOne(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const tenant = await this.tenantService.findById(request.params.id)
    if (!tenant) {
      return reply.status(404).send({ message: 'Tenant not found' })
    }
    return tenant
  }

  async findAll(
    request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>,
    reply: FastifyReply
  ) {
    const { page = 1, limit = 10 } = request.query
    const tenants = await this.tenantService.findAll()

    // For now, return all tenants without pagination
    reply.header('X-Total-Count', tenants.length.toString())
    reply.header('X-Page', page.toString())
    reply.header('X-Limit', limit.toString())

    return tenants
  }

  async update(
    request: FastifyRequest<{
      Params: { id: string }
      Body: UpdateTenantDto
    }>,
    reply: FastifyReply
  ) {
    const tenant = await this.tenantService.update(request.params.id, request.body)
    if (!tenant) {
      return reply.status(404).send({ message: 'Tenant not found' })
    }
    return tenant
  }
}
