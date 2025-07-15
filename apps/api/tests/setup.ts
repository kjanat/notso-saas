import 'reflect-metadata'
import {
  getTestDatabase,
  setupMockEnvironment,
  setupTestDatabase,
  teardownTestDatabase,
} from '@saas/test-utils'
import { afterAll, beforeAll, beforeEach } from 'vitest'

// Setup mock environment variables
setupMockEnvironment()

// Override with test-specific values
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/saas_platform_test'
process.env.REDIS_URL = 'redis://localhost:6379/1'

beforeAll(async () => {
  // Initialize test database
  await setupTestDatabase()
})

afterAll(async () => {
  // Clean up database connections
  await teardownTestDatabase()
})

beforeEach(async () => {
  // Clean database before each test
  await setupTestDatabase()
})

// Make test utilities available globally
declare global {
  var testPrisma: ReturnType<typeof getTestDatabase>
}

global.testPrisma = getTestDatabase()
