import { createTenantFixture, createTestApp } from '@saas/test-utils'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { healthModule } from '../../src/modules/health/health.module'
import { tenantModule } from '../../src/modules/tenant/tenant.module'

describe('Tenant API Integration Tests', () => {
  let app: FastifyInstance
  let _createdTenantId: string

  beforeAll(async () => {
    app = await createTestApp({
      modules: [
        { module: healthModule, prefix: '/health' },
        { module: tenantModule, prefix: '/tenants' },
      ],
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /tenants', () => {
    it('should create a new tenant successfully', async () => {
      const tenantFixture = createTenantFixture()
      const tenantData = {
        name: tenantFixture.name,
        plan: tenantFixture.plan,
        slug: tenantFixture.slug,
      }

      const response = await app.inject({
        method: 'POST',
        payload: tenantData,
        url: '/tenants',
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)

      expect(body).toMatchObject({
        apiKey: expect.any(String),
        currentChatbots: 0,
        id: expect.any(String),
        isActive: true,
        maxChatbots: 1,
        name: tenantData.name,
        slug: tenantData.slug,
        subscriptionPlan: 'free',
      })

      _createdTenantId = body.id
    })

    it('should return 400 for invalid tenant data', async () => {
      const invalidData = {
        name: '', // Empty name
        slug: 'invalid slug!', // Invalid slug format
      }

      const response = await app.inject({
        method: 'POST',
        payload: invalidData,
        url: '/tenants',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return error for duplicate slug', async () => {
      const tenantData = {
        name: 'Company One',
        plan: 'free',
        slug: 'unique-slug',
      }

      // Create first tenant
      await app.inject({
        method: 'POST',
        payload: tenantData,
        url: '/tenants',
      })

      // Try to create another with same slug
      const response = await app.inject({
        method: 'POST',
        payload: {
          ...tenantData,
          name: 'Different Name',
        },
        url: '/tenants',
      })

      expect(response.statusCode).toBe(500) // TenantService throws error
      expect(response.body).toContain('slug already exists')
    })
  })

  describe('GET /tenants/:id', () => {
    it('should retrieve a tenant by ID', async () => {
      // First create a tenant
      const createResponse = await app.inject({
        method: 'POST',
        payload: createTenantFixture({ plan: 'pro' }),
        url: '/tenants',
      })

      const createdTenant = JSON.parse(createResponse.body)

      // Now retrieve it
      const response = await app.inject({
        method: 'GET',
        url: `/tenants/${createdTenant.id}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body).toMatchObject({
        apiKey: createdTenant.apiKey,
        id: createdTenant.id,
        name: createdTenant.name,
        slug: createdTenant.slug,
        subscriptionPlan: 'pro',
      })
    })

    it('should return 404 for non-existent tenant', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tenants/non-existent-id',
      })

      expect(response.statusCode).toBe(404)
      expect(response.body).toContain('Tenant not found')
    })
  })

  describe('GET /tenants', () => {
    it('should list all tenants with pagination', async () => {
      // Create multiple tenants
      const tenantPromises = Array.from({ length: 5 }, (_, i) =>
        app.inject({
          method: 'POST',
          payload: createTenantFixture({
            name: `Company ${i}`,
            slug: `company-${i}`,
          }),
          url: '/tenants',
        })
      )

      await Promise.all(tenantPromises)

      // List tenants
      const response = await app.inject({
        method: 'GET',
        url: '/tenants?page=1&limit=3',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeLessThanOrEqual(3)
      expect(response.headers['x-total-count']).toBeDefined()
      expect(response.headers['x-page']).toBe('1')
      expect(response.headers['x-limit']).toBe('3')
    })
  })

  describe('PATCH /tenants/:id', () => {
    it('should update a tenant successfully', async () => {
      // Create a tenant
      const createResponse = await app.inject({
        method: 'POST',
        payload: createTenantFixture({
          name: 'Original Name',
          plan: 'free',
          slug: 'original-slug',
        }),
        url: '/tenants',
      })

      const tenant = JSON.parse(createResponse.body)

      // Update it
      const updateResponse = await app.inject({
        method: 'PATCH',
        payload: {
          name: 'Updated Name',
          plan: 'pro',
        },
        url: `/tenants/${tenant.id}`,
      })

      expect(updateResponse.statusCode).toBe(200)
      const updatedTenant = JSON.parse(updateResponse.body)

      expect(updatedTenant.name).toBe('Updated Name')
      expect(updatedTenant.subscriptionPlan).toBe('pro')
      expect(updatedTenant.slug).toBe('original-slug') // Slug should not change
    })

    it('should return 404 when updating non-existent tenant', async () => {
      const response = await app.inject({
        method: 'PATCH',
        payload: {
          name: 'New Name',
        },
        url: '/tenants/non-existent-id',
      })

      expect(response.statusCode).toBe(404)
      expect(response.body).toContain('Tenant not found')
    })
  })
})
