import { injectable, inject } from 'tsyringe'
import { FastifyRequest, FastifyReply } from 'fastify'
import type { ITenantService } from './tenant.interfaces.js'
import { CreateTenantDto, UpdateTenantDto } from './tenant.dto.js'

@injectable()
export class TenantController {
  constructor(@inject('ITenantService') private readonly tenantService: ITenantService) {}

  async create(request: FastifyRequest<{ Body: CreateTenantDto }>, reply: FastifyReply) {
    const tenant = await this.tenantService.create(request.body)
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
    const tenants = await this.tenantService.findAll({ page, limit })
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
