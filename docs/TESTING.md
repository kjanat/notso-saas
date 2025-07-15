# Testing Guide

This project uses a comprehensive testing strategy integrated with Turbo for optimal performance in our monorepo.

## Testing Stack

- **Unit & Integration Tests**: Vitest (with TypeScript and ESM support)
- **E2E Tests**: Playwright
- **Test Data**: @faker-js/faker
- **API Testing**: Supertest

## Running Tests

### All Tests
```bash
# Run all tests across the monorepo
pnpm test

# Run tests for changed files only (CI optimization)
pnpm test:affected

# Run all test types in CI mode
pnpm test:ci
```

### By Test Type
```bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# Watch mode (unit tests)
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### By Package
```bash
# Test specific package
pnpm test:api          # API service tests
pnpm --filter=@saas/worker test  # Worker tests
```

## Test Structure

```
apps/
├── api/
│   ├── src/
│   │   └── **/*.test.ts      # Unit tests (colocated)
│   ├── tests/
│   │   ├── setup.ts           # Test setup
│   │   └── integration/       # Integration tests
│   └── vitest.config.ts
├── worker/
│   └── (similar structure)
└── e2e/
    ├── tests/
    │   ├── api/               # API E2E tests
    │   └── websocket/         # WebSocket E2E tests
    └── playwright.config.ts

packages/
└── shared/
    └── test-utils/            # Shared testing utilities
        ├── database.ts        # DB test helpers
        ├── fixtures.ts        # Test data factories
        ├── mocks.ts          # Common mocks
        └── vitest.config.ts  # Shared Vitest config
```

## Writing Tests

### Unit Tests

```typescript
// src/modules/tenant/tenant.service.test.ts
import { describe, it, expect, vi } from 'vitest'
import { TenantService } from './tenant.service'
import { createMockRepository, createMockCache } from '@saas/test-utils'

describe('TenantService', () => {
  it('should create tenant with API key', async () => {
    const mockRepo = createMockRepository(['create', 'findBySlug'])
    const mockCache = createMockCache()
    
    const service = new TenantService(mockRepo, mockCache)
    const result = await service.create({
      name: 'Test Corp',
      slug: 'test-corp',
    })
    
    expect(result.apiKey).toBeDefined()
    expect(mockRepo.create).toHaveBeenCalledOnce()
  })
})
```

### Integration Tests

```typescript
// tests/integration/tenant-api.test.ts
import { describe, it, expect } from 'vitest'
import { createTestApp, createTenantFixture } from '@saas/test-utils'

describe('Tenant API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp({
      modules: [{ module: tenantModule, prefix: '/tenants' }]
    })
  })

  it('POST /tenants creates tenant', async () => {
    const tenant = createTenantFixture()
    
    const response = await app.inject({
      method: 'POST',
      url: '/tenants',
      payload: tenant,
    })
    
    expect(response.statusCode).toBe(201)
  })
})
```

### E2E Tests

```typescript
// apps/e2e/tests/api/tenant-flow.test.ts
import { test, expect } from '@playwright/test'
import { createTenantFixture } from '@saas/test-utils'

test('complete tenant lifecycle', async ({ request }) => {
  const tenant = createTenantFixture()
  
  // Create tenant
  const createRes = await request.post('/tenants', { data: tenant })
  expect(createRes.ok()).toBeTruthy()
  
  const { id, apiKey } = await createRes.json()
  
  // Use API key for subsequent requests
  const chatbotRes = await request.post('/chatbots', {
    headers: { 'X-API-Key': apiKey },
    data: { name: 'Support Bot' }
  })
  
  expect(chatbotRes.ok()).toBeTruthy()
})
```

## Test Utilities

### Database Helpers

```typescript
import { getTestDatabase, setupTestDatabase } from '@saas/test-utils'

// In your test setup
beforeAll(async () => {
  await setupTestDatabase() // Cleans and resets DB
})
```

### Test Fixtures

```typescript
import { 
  createTenantFixture,
  createUserFixture,
  createChatbotFixture 
} from '@saas/test-utils'

const tenant = createTenantFixture({ plan: 'pro' })
const user = createUserFixture({ email: 'test@example.com' })
```

### Mocks

```typescript
import { 
  createMockLogger,
  createMockCache,
  createMockQueue 
} from '@saas/test-utils'

const logger = createMockLogger()
logger.info('test') // Tracked by Vitest spy
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to master/develop branches

GitHub Actions workflow:
1. Sets up PostgreSQL and Redis services
2. Installs dependencies with cache
3. Runs linting and type checking
4. Executes unit, integration, and E2E tests in parallel
5. Uploads coverage reports to Codecov

## Coverage Requirements

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 90%
- **Lines**: 80%

View coverage locally:
```bash
pnpm test:coverage
open coverage/index.html
```

## Best Practices

1. **Colocate unit tests** with source files
2. **Use test fixtures** for consistent test data
3. **Clean database** between tests for isolation
4. **Mock external services** in unit tests
5. **Test real integrations** in integration/E2E tests
6. **Use Turbo caching** to speed up test runs
7. **Write tests first** (TDD) for new features

## Troubleshooting

### Tests failing locally
```bash
# Ensure services are running
docker-compose up -d

# Reset test database
pnpm db:push

# Clear Turbo cache
pnpm turbo run test --force
```

### E2E tests timeout
```bash
# Run with headed browser to debug
pnpm test:e2e:headed

# Increase timeout in playwright.config.ts
```

### Coverage not updating
```bash
# Clear coverage directory
rm -rf coverage/

# Run with --no-cache
pnpm test:coverage --no-cache
```