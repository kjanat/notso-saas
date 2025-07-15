import { setupMockEnvironment } from '@saas/test-utils'

// Setup mock environment
setupMockEnvironment()

// Worker-specific test configuration
process.env.REDIS_URL = 'redis://localhost:6379/2' // Use different Redis DB for worker tests
