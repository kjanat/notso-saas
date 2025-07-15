import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { Tenant } from '../../domain/entities/tenant.entity'
import type { ICacheService, ILogger, IQueueService } from '../../shared/interfaces/base.interfaces'
import type { ITenantRepository, ITenantService } from './tenant.interfaces'
import { TenantService } from './tenant.service'

describe('TenantService', () => {
  let tenantService: ITenantService
  let mockRepository: ITenantRepository
  let mockCache: ICacheService
  let mockQueue: IQueueService
  let mockLogger: ILogger

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      findByApiKey: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      incrementUsage: vi.fn(),
      update: vi.fn(),
      updateSubscription: vi.fn(),
    }

    mockCache = {
      delete: vi.fn(),
      flush: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
    }

    mockQueue = {
      addJob: vi.fn(),
      getJob: vi.fn(),
      getJobs: vi.fn(),
      removeJob: vi.fn(),
    }

    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }

    // Create service instance with mocks
    tenantService = new TenantService(mockRepository, mockCache, mockQueue, mockLogger)
  })

  describe('create', () => {
    it('should create a new tenant successfully', async () => {
      const createDto = {
        name: 'Test Company',
        plan: 'free' as const,
        slug: 'test-company',
      }

      const mockTenant = Tenant.create(
        createDto.name,
        createDto.slug,
        'test-api-key',
        createDto.plan
      )

      ;(mockRepository.findBySlug as Mock).mockResolvedValue(null)
      ;(mockRepository.create as Mock).mockResolvedValue(mockTenant)
      ;(mockQueue.addJob as Mock).mockResolvedValue(undefined)

      const result = await tenantService.create(createDto)

      expect(result).toBeDefined()
      expect(result.name).toBe(createDto.name)
      expect(result.slug).toBe(createDto.slug)
      expect(result.apiKey).toBeDefined()

      expect(mockRepository.findBySlug).toHaveBeenCalledWith(createDto.slug)
      expect(mockRepository.create).toHaveBeenCalledWith(createDto)
      expect(mockQueue.addJob).toHaveBeenCalledWith('tenant-provisioning', 'provision-database', {
        slug: result.slug,
        tenantId: result.id,
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Tenant created', {
        slug: result.slug,
        tenantId: result.id,
      })
    })

    it('should throw error if slug already exists', async () => {
      const createDto = {
        name: 'Test Company',
        plan: 'free' as const,
        slug: 'existing-slug',
      }

      const existingTenant = Tenant.create('Existing', 'existing-slug', 'api-key', 'free')
      ;(mockRepository.findBySlug as Mock).mockResolvedValue(existingTenant)

      await expect(tenantService.create(createDto)).rejects.toThrow('Tenant slug already exists')

      expect(mockRepository.create).not.toHaveBeenCalled()
      expect(mockQueue.addJob).not.toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should return tenant from cache if available', async () => {
      const tenantId = 'test-id'
      const cachedData = {
        apiKey: 'cached-api-key',
        currentChatbots: 0,
        id: tenantId,
        isActive: true,
        maxChatbots: 1,
        name: 'Cached Tenant',
        slug: 'cached-tenant',
        subscriptionPlan: 'free',
      }

      ;(mockCache.get as Mock).mockResolvedValue(cachedData)

      const result = await tenantService.findById(tenantId)

      expect(result).toBeDefined()
      expect(result.name).toBe(cachedData.name)
      expect(mockCache.get).toHaveBeenCalledWith(`tenant:${tenantId}`)
      expect(mockRepository.findById).not.toHaveBeenCalled()
    })

    it('should fetch from repository and cache if not in cache', async () => {
      const tenantId = 'test-id'
      const tenant = Tenant.create('Test Tenant', 'test-tenant', 'api-key', 'free')

      ;(mockCache.get as Mock).mockResolvedValue(null)
      ;(mockRepository.findById as Mock).mockResolvedValue(tenant)
      ;(mockCache.set as Mock).mockResolvedValue(undefined)

      const result = await tenantService.findById(tenantId)

      expect(result).toBeDefined()
      expect(result.id).toBe(tenant.id)
      expect(mockRepository.findById).toHaveBeenCalledWith(tenantId)
      expect(mockCache.set).toHaveBeenCalledWith(
        `tenant:${tenantId}`,
        expect.objectContaining({
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        }),
        300
      )
    })

    it('should throw error if tenant not found', async () => {
      const tenantId = 'non-existent'

      ;(mockCache.get as Mock).mockResolvedValue(null)
      ;(mockRepository.findById as Mock).mockResolvedValue(null)

      await expect(tenantService.findById(tenantId)).rejects.toThrow(
        `Tenant not found: ${tenantId}`
      )
    })
  })

  describe('updateSubscription', () => {
    it('should update subscription and process domain events', async () => {
      const tenantId = 'test-id'
      const newPlan = 'pro'
      const tenant = Tenant.create('Test Tenant', 'test-tenant', 'api-key', 'free')
      const updatedTenant = Tenant.create('Test Tenant', 'test-tenant', 'api-key', newPlan)

      ;(mockRepository.findById as Mock).mockResolvedValue(tenant)
      ;(mockRepository.updateSubscription as Mock).mockResolvedValue(updatedTenant)
      ;(mockQueue.addJob as Mock).mockResolvedValue(undefined)
      ;(mockCache.delete as Mock).mockResolvedValue(undefined)

      const result = await tenantService.updateSubscription(tenantId, newPlan)

      expect(result.subscriptionPlan).toBe(newPlan)
      expect(mockRepository.updateSubscription).toHaveBeenCalledWith(tenantId, newPlan)
      expect(mockCache.delete).toHaveBeenCalledWith(`tenant:${tenantId}`)
    })
  })

  describe('trackUsage', () => {
    it('should increment usage and queue analytics job', async () => {
      const tenantId = 'test-id'
      const metric = 'messages'
      const amount = 10

      ;(mockRepository.incrementUsage as Mock).mockResolvedValue(undefined)
      ;(mockQueue.addJob as Mock).mockResolvedValue(undefined)

      await tenantService.trackUsage(tenantId, metric, amount)

      expect(mockRepository.incrementUsage).toHaveBeenCalledWith(tenantId, metric, amount)
      expect(mockQueue.addJob).toHaveBeenCalledWith(
        'analytics',
        'track-usage',
        expect.objectContaining({
          amount,
          metric,
          tenantId,
          timestamp: expect.any(Date),
        })
      )
    })
  })

  describe('delete', () => {
    it('should delete tenant and clear cache', async () => {
      const tenantId = 'test-id'

      ;(mockRepository.delete as Mock).mockResolvedValue(undefined)
      ;(mockCache.delete as Mock).mockResolvedValue(undefined)

      await tenantService.delete(tenantId)

      expect(mockRepository.delete).toHaveBeenCalledWith(tenantId)
      expect(mockCache.delete).toHaveBeenCalledWith(`tenant:${tenantId}`)
    })
  })
})
