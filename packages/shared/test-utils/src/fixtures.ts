import { faker } from '@faker-js/faker'
import type { Chatbot, Tenant, User } from '@saas/database'

export function createTenantFixture(
  overrides?: Partial<Tenant>
): Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    apiKey: `sk_test_${faker.string.alphanumeric(32)}`,
    isActive: true,
    maxChatbots: 1,
    metadata: {},
    name: faker.company.name(),
    plan: 'free',
    settings: {},
    slug: faker.lorem.slug(),
    ...overrides,
  }
}

export function createUserFixture(
  overrides?: Partial<User>
): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    email: faker.internet.email(),
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: null,
    name: faker.person.fullName(),
    passwordHash: faker.string.alphanumeric(60),
    ...overrides,
  }
}

export function createChatbotFixture(
  tenantId: string,
  overrides?: Partial<Chatbot>
): Omit<Chatbot, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    deploymentKey: `deploy_${faker.string.alphanumeric(24)}`,
    isActive: true,
    maxTokens: 500,
    metadata: {},
    model: 'gpt-4-turbo-preview',
    name: faker.commerce.productName(),
    provider: 'openai',
    settings: {},
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.7,
    tenantId,
    ...overrides,
  }
}

export function createConversationFixture(
  chatbotId: string,
  overrides?: Partial<Record<string, unknown>>
) {
  return {
    chatbotId,
    metadata: {},
    sessionId: faker.string.uuid(),
    status: 'active',
    ...overrides,
  }
}

export function createMessageFixture(
  conversationId: string,
  overrides?: Partial<Record<string, unknown>>
) {
  return {
    content: faker.lorem.sentence(),
    conversationId,
    role: 'user',
    ...overrides,
  }
}

// Batch creation helpers
export function createTenantWithChatbots(chatbotCount = 1) {
  const tenant = createTenantFixture()
  const chatbots = Array.from({ length: chatbotCount }, () => createChatbotFixture('temp-id'))

  return { chatbots, tenant }
}

export function createFullTestScenario() {
  const tenant = createTenantFixture()
  const user = createUserFixture()
  const chatbot = createChatbotFixture('temp-id')
  const conversation = createConversationFixture('temp-id')
  const messages = [
    createMessageFixture('temp-id', { role: 'user' }),
    createMessageFixture('temp-id', { role: 'assistant' }),
  ]

  return { chatbot, conversation, messages, tenant, user }
}
