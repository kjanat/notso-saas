import { setupMockEnvironment } from '@saas/test-utils'
import { vi } from 'vitest'

// Setup mock environment
setupMockEnvironment()

// Worker-specific test configuration
process.env.REDIS_URL = 'redis://localhost:6379/2' // Use different Redis DB for worker tests

// Mock ioredis for tests
vi.mock('ioredis', () => {
  const mockRedis = {
    connect: vi.fn(),
    del: vi.fn(),
    disconnect: vi.fn(),
    duplicate: vi.fn(() => mockRedis),
    get: vi.fn(),
    on: vi.fn(),
    ping: vi.fn(),
    publish: vi.fn(),
    set: vi.fn(),
    subscribe: vi.fn(),
  }

  return {
    default: vi.fn(() => mockRedis),
    Redis: vi.fn(() => mockRedis),
  }
})
