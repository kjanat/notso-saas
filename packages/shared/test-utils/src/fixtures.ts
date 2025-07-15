import { faker } from '@faker-js/faker'
import type { Tenant, User } from '@saas/database'

export function createTenantFixture(
  overrides?: Partial<Tenant>
): Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    databaseName: `db_${faker.string.alphanumeric(16)}`,
    isActive: true,
    maxChatbots: 1,
    metadata: {},
    name: faker.company.name(),
    settings: {},
    slug: faker.lorem.slug(),
    subscriptionPlan: 'TRIAL',
    subscriptionStatus: 'TRIAL',
    trialEndsAt: faker.date.future(),
    ...overrides,
  }
}

export function createUserFixture(
  overrides?: Partial<User>
): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    avatarUrl: faker.image.avatar(),
    email: faker.internet.email(),
    emailVerified: true,
    isActive: true,
    lastLoginAt: null,
    metadata: {},
    name: faker.person.fullName(),
    passwordHash: faker.string.alphanumeric(60),
    preferences: {},
    ...overrides,
  }
}

// Placeholder for future chatbot-related fixtures
// These will be implemented when the Chatbot, Conversation, and Message models are added

export function createApiKeyFixture(
  tenantId: string,
  overrides?: Partial<Record<string, unknown>>
) {
  return {
    key: `sk_${faker.string.alphanumeric(32)}`,
    name: faker.lorem.words(2),
    permissions: [],
    tenantId,
    ...overrides,
  }
}

// Batch creation helpers
export function createTenantWithApiKeys(apiKeyCount = 1): {
  tenant: ReturnType<typeof createTenantFixture>
  apiKeys: ReturnType<typeof createApiKeyFixture>[]
} {
  const tenant = createTenantFixture()
  const apiKeys = Array.from({ length: apiKeyCount }, () => createApiKeyFixture('temp-id'))

  return { apiKeys, tenant }
}

export function createFullTestScenario(): {
  tenant: ReturnType<typeof createTenantFixture>
  user: ReturnType<typeof createUserFixture>
  apiKey: ReturnType<typeof createApiKeyFixture>
} {
  const tenant = createTenantFixture()
  const user = createUserFixture()
  const apiKey = createApiKeyFixture('temp-id')

  return { apiKey, tenant, user }
}
