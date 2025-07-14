# From Microservices to Modular Monolith - Simplification Guide

## Quick Comparison

### Before (Complex)

- **11 Docker containers** running
- **8+ microservices** to maintain
- **~8GB RAM** just for infrastructure
- **5+ minutes** to start development
- **15+ ports** to manage
- **3 message queues** (Redis, RabbitMQ, Kafka)
- **DevContainer** with Docker-in-Docker

### After (Simple)

- **3 Docker containers** (PostgreSQL, Redis, MinIO/optional)
- **1 main API service** (modular monolith)
- **~2GB RAM** for infrastructure
- **30 seconds** to start
- **3 ports** to manage
- **1 queue system** (BullMQ on Redis)
- **Simple Docker** or just native development

## Code Structure Transformation

### From Microservices:

```
apps/
├── api-gateway/
├── tenant-service/
├── chatbot-service/
├── conversation-service/
├── ai-service/
├── avatar-service/
├── knowledge-service/
└── analytics-service/
```

### To Modular Monolith:

```
apps/
├── api/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── tenant/
│   │   │   │   ├── tenant.controller.ts
│   │   │   │   ├── tenant.service.ts
│   │   │   │   ├── tenant.repository.ts
│   │   │   │   └── tenant.module.ts
│   │   │   ├── chatbot/
│   │   │   ├── conversation/
│   │   │   ├── ai/
│   │   │   └── analytics/
│   │   ├── shared/
│   │   │   ├── database/
│   │   │   ├── cache/
│   │   │   └── queue/
│   │   └── main.ts
├── worker/  # Background jobs only
└── websocket/  # Real-time only
```

## Step-by-Step Migration

### 1. Start Development (Immediate)

```bash
# Use the new simple setup
./scripts/dev.sh

# Or manually:
docker-compose -f docker-compose.dev.yml up -d
pnpm dev
```

### 2. Consolidate Services (Week 1)

Create a single API service with modules:

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common'
import { TenantModule } from './modules/tenant/tenant.module'
import { ChatbotModule } from './modules/chatbot/chatbot.module'
import { ConversationModule } from './modules/conversation/conversation.module'
import { AIModule } from './modules/ai/ai.module'

@Module({
  imports: [
    DatabaseModule, // Single DB connection
    CacheModule, // Redis for caching
    QueueModule, // BullMQ for jobs
    TenantModule,
    ChatbotModule,
    ConversationModule,
    AIModule,
  ],
})
export class AppModule {}
```

### 3. Simplify Message Queue (Week 2)

Replace RabbitMQ + Kafka with BullMQ:

```typescript
// Before: Complex event system
await rabbitMQ.publish('conversation.events', message);
await kafka.send({ topic: 'analytics', messages: [...] });

// After: Simple job queue
import { Queue } from 'bullmq';

const aiQueue = new Queue('ai-jobs');
await aiQueue.add('process-message', {
  conversationId,
  message,
  chatbotId
});
```

### 4. Use PostgreSQL for Analytics (Week 3)

```sql
-- Instead of Elasticsearch, use PostgreSQL
CREATE TABLE analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    chatbot_id UUID NOT NULL,
    event_type VARCHAR(50),
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create indexes for fast queries
CREATE INDEX idx_events_tenant_date ON analytics_events(tenant_id, created_at);
CREATE INDEX idx_events_properties ON analytics_events USING GIN(properties);

-- Query example
SELECT
    date_trunc('hour', created_at) as hour,
    event_type,
    COUNT(*) as count
FROM analytics_events
WHERE tenant_id = ?
    AND created_at > NOW() - INTERVAL '7 days'
    AND properties->>'chatbot_id' = ?
GROUP BY hour, event_type;
```

### 5. Local File Storage for Development (Week 4)

```typescript
// Simple file storage for development
class LocalStorageService {
  async uploadAvatar(file: Buffer, filename: string) {
    if (process.env.NODE_ENV === 'development') {
      // Just save locally
      const path = `./uploads/avatars/${filename}`
      await fs.writeFile(path, file)
      return `/uploads/avatars/${filename}`
    } else {
      // Use S3 in production
      return await s3.upload(file, filename)
    }
  }
}
```

## Environment Variables (Simplified)

### Before (.env - 50+ variables)

```env
API_GATEWAY_PORT=3000
TENANT_SERVICE_PORT=3001
CHATBOT_SERVICE_PORT=3002
# ... 20 more service ports
RABBITMQ_URL=...
KAFKA_BROKERS=...
ELASTICSEARCH_URL=...
# ... etc
```

### After (.env - 10 variables)

```env
# Just the essentials
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_platform
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret
NODE_ENV=development
LOG_LEVEL=debug

# Optional
S3_BUCKET=avatars  # Only for production
SENTRY_DSN=...     # Only for production
```

## Running Without Docker

You can even run without Docker for maximum simplicity:

```bash
# Install PostgreSQL and Redis locally (Mac)
brew install postgresql@17 redis
brew services start postgresql@17
brew services start redis

# Setup database
createdb saas_platform

# Install deps and run
pnpm install
pnpm dev
```

## Testing the Simplified Setup

```bash
# Unit tests (no infrastructure needed)
pnpm test

# Integration tests (just need PostgreSQL + Redis)
docker-compose -f docker-compose.dev.yml up -d
pnpm test:integration

# E2E tests
pnpm test:e2e
```

## Performance Benefits

1. **Faster Development**
   - Hot reload in 1-2 seconds (vs 10+ seconds with microservices)
   - Single debugger attachment point
   - Unified logging

2. **Better Performance**
   - No inter-service HTTP calls
   - No serialization/deserialization overhead
   - Shared in-memory caches

3. **Easier Deployment**
   - Single Docker image to build
   - One application to monitor
   - Simpler CI/CD pipeline

## When You Actually Need Microservices

Don't add complexity until you have:

- ✅ Multiple teams that can't coordinate
- ✅ 1000+ requests/second sustained
- ✅ Different scaling requirements per service
- ✅ Different tech stack requirements
- ✅ Regulatory isolation requirements

For your scale (20 customers, 200k requests/day), a monolith will be:

- Faster to develop
- Cheaper to run
- Easier to debug
- More performant
- Simpler to deploy

## Next Steps

1. **Today**: Start using `docker-compose.dev.yml`
2. **This Week**: Merge services into monolith structure
3. **Next Week**: Remove unnecessary infrastructure
4. **Month 1**: Full production deployment with 3 containers total

Remember: You can always add complexity later, but it's hard to remove it!
