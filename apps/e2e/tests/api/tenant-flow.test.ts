import { expect, test } from '@playwright/test'
import { createTenantFixture } from '@saas/test-utils'

test.describe('Tenant Management E2E Flow', () => {
  let tenantId: string
  let apiKey: string

  test('complete tenant lifecycle', async ({ request }) => {
    // Step 1: Create a new tenant
    const tenantFixture = createTenantFixture()
    const tenantData = {
      name: tenantFixture.name,
      plan: 'free',
      slug: tenantFixture.slug,
    }

    const createResponse = await request.post('/tenants', {
      data: tenantData,
    })

    expect(createResponse.ok()).toBeTruthy()
    expect(createResponse.status()).toBe(201)

    const createdTenant = await createResponse.json()
    expect(createdTenant).toMatchObject({
      apiKey: expect.any(String),
      currentChatbots: 0,
      id: expect.any(String),
      isActive: true,
      maxChatbots: 1,
      name: tenantData.name,
      slug: tenantData.slug,
      subscriptionPlan: 'free',
    })

    tenantId = createdTenant.id
    apiKey = createdTenant.apiKey

    // Step 2: Verify tenant can be retrieved
    const getResponse = await request.get(`/tenants/${tenantId}`)
    expect(getResponse.ok()).toBeTruthy()

    const retrievedTenant = await getResponse.json()
    expect(retrievedTenant.id).toBe(tenantId)
    expect(retrievedTenant.apiKey).toBe(apiKey)

    // Step 3: Update tenant to pro plan
    const updateResponse = await request.patch(`/tenants/${tenantId}`, {
      data: {
        plan: 'pro',
      },
    })

    expect(updateResponse.ok()).toBeTruthy()
    const updatedTenant = await updateResponse.json()
    expect(updatedTenant.subscriptionPlan).toBe('pro')
    expect(updatedTenant.maxChatbots).toBeGreaterThan(1)

    // Step 4: Verify tenant appears in list
    const listResponse = await request.get('/tenants')
    expect(listResponse.ok()).toBeTruthy()

    const tenants = await listResponse.json()
    const foundTenant = tenants.find((t: { id: string }) => t.id === tenantId)
    expect(foundTenant).toBeDefined()
    expect(foundTenant.subscriptionPlan).toBe('pro')
  })

  test('tenant API key authentication flow', async ({ request }) => {
    // Create a tenant
    const createResponse = await request.post('/tenants', {
      data: {
        name: 'API Test Company',
        plan: 'free',
        slug: 'api-test-company',
      },
    })

    const tenant = await createResponse.json()
    const tenantApiKey = tenant.apiKey

    // TODO: Once chatbot endpoints are implemented, test API key authentication
    // For now, we'll just verify the API key was generated
    expect(tenantApiKey).toBeDefined()
    expect(tenantApiKey.length).toBeGreaterThan(20)
  })

  test('tenant plan limits enforcement', async ({ request }) => {
    // Create a free tier tenant
    const createResponse = await request.post('/tenants', {
      data: {
        name: 'Limited Company',
        plan: 'free',
        slug: 'limited-company',
      },
    })

    const tenant = await createResponse.json()

    // Verify free plan limits
    expect(tenant.subscriptionPlan).toBe('free')
    expect(tenant.maxChatbots).toBe(1)

    // TODO: Once chatbot creation is implemented, test that:
    // 1. Free plan can only create 1 chatbot
    // 2. Attempting to create a 2nd chatbot fails
    // 3. After upgrading to pro, can create more chatbots
  })

  test('health check includes all services', async ({ request }) => {
    const response = await request.get('/health')
    expect(response.ok()).toBeTruthy()

    const health = await response.json()
    expect(health.status).toBe('healthy')
    expect(health.services).toMatchObject({
      database: 'connected',
      redis: 'connected',
      worker: expect.any(String),
    })
  })
})
