# Simplified Architecture Strategy

## Scale Requirements

- 20 customers × 10,000 requests/day = 200,000 requests/day
- Average: ~2.3 requests/second
- Peak (10x): ~23-50 requests/second
- This is **moderate scale** - doesn't require massive complexity

## Current vs Simplified Architecture

### What You Have Now (Over-engineered)

```
PostgreSQL + Elasticsearch + Redis + RabbitMQ + Kafka + MinIO + Zookeeper + Traefik
= 8 services + complex orchestration
```

### What You Actually Need

#### For Development (Local)

```yaml
# Just 3 services:
1. PostgreSQL (all data)
2. Redis (cache + queues)
3. MinIO (3D models) - or just use local filesystem
```

#### For Production (20 customers scale)

```yaml
# Core Services (Consolidated):
1. PostgreSQL - Handle everything with proper indexing
2. Redis - Cache + BullMQ for queues (no need for RabbitMQ AND Kafka)
3. S3/CloudFront - For 3D assets (not self-hosted MinIO)

# Application Services (Simplified):
1. API Service - Monolith handling all business logic
2. WebSocket Service - Real-time chat only
3. Background Worker - Process AI jobs
```

## Consolidation Strategy

### 1. Eliminate Redundant Services

**Remove These:**

- ❌ **Kafka + Zookeeper**: Overkill for 200k requests/day. Use BullMQ (Redis-based)
- ❌ **RabbitMQ**: Redundant with BullMQ
- ❌ **Elasticsearch**: PostgreSQL full-text search is sufficient at this scale
- ❌ **Traefik**: Use Nginx or cloud load balancer
- ❌ **Separate microservices**: Merge into 2-3 services max

**Keep These:**

- ✅ **PostgreSQL**: Rock-solid, handles JSON, full-text search, vector embeddings (pgvector)
- ✅ **Redis**: Caching + BullMQ for job queues
- ✅ **S3/CDN**: For 3D models (use cloud service, not MinIO)

### 2. Service Consolidation

Instead of 8 microservices, use a **modular monolith**:

```typescript
// apps/api/src/modules/
├── tenant/          // Multi-tenancy
├── chatbot/         // Chatbot config
├── conversation/    // Chat logic
├── ai/             // AI processing
├── avatar/         // 3D avatar management
├── knowledge/      // Knowledge base
└── analytics/      // Simple metrics

// Single API service with modular structure
```

### 3. Simplified Message Flow

**Current (Complex):**

```
Client → Traefik → API Gateway → Service A → RabbitMQ → Service B → Kafka → Analytics
```

**Simplified:**

```
Client → Nginx → API Service → Redis Queue → Background Worker
                      ↓
                  PostgreSQL
```

## Implementation Plan

### Step 1: Create Simplified Docker Setup

```yaml
# docker-compose.simple.yml
version: '3.8'

services:
  # Database - handles everything
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: saas_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - '5432:5432'

  # Cache & Queues
  redis:
    image: redis:8-alpine
    volumes:
      - ./data/redis:/data
    ports:
      - '6379:6379'

  # API (all business logic)
  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/saas_platform
      REDIS_URL: redis://redis:6379
    ports:
      - '3000:3000'
    depends_on:
      - db
      - redis

  # Worker (AI processing, background jobs)
  worker:
    build: ./apps/worker
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/saas_platform
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  # WebSocket (real-time only)
  websocket:
    build: ./apps/websocket
    environment:
      REDIS_URL: redis://redis:6379
    ports:
      - '3001:3001'
    depends_on:
      - redis
```

### Step 2: Use PostgreSQL for Everything

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Full-text search
CREATE EXTENSION IF NOT EXISTS "vector";  -- For embeddings

-- Tenant isolation with schemas
CREATE SCHEMA IF NOT EXISTS platform;  -- Platform data
CREATE SCHEMA IF NOT EXISTS tenant_1;  -- Per-tenant schemas
CREATE SCHEMA IF NOT EXISTS tenant_2;

-- JSON storage for flexible data
CREATE TABLE chatbots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    config JSONB NOT NULL, -- Flexible configuration
    avatar_data JSONB,     -- Avatar settings
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search on knowledge base
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL,
    content TEXT,
    embedding vector(1536), -- For RAG
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- Analytics with time-series data
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL,
    event_type VARCHAR(50),
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Step 3: Simple Queue System with BullMQ

```typescript
// Ditch RabbitMQ + Kafka, just use BullMQ
import { Queue, Worker } from 'bullmq'

// Single queue for AI processing
const aiQueue = new Queue('ai-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
})

// Simple worker
new Worker(
  'ai-processing',
  async job => {
    const { chatbotId, message, conversationId } = job.data

    // Process with AI
    const response = await processWithAI(message)

    // Store in DB
    await saveMessage(conversationId, response)

    // Emit via WebSocket
    await emitToClient(conversationId, response)
  },
  { connection: redis }
)
```

### Step 4: Replace MinIO with Cloud Storage

```typescript
// For development: Use local filesystem
if (process.env.NODE_ENV === 'development') {
  // Save to ./uploads/avatars/
  await fs.writeFile(`./uploads/avatars/${avatarId}.glb`, buffer)
}

// For production: Use S3/CloudFront
else {
  await s3
    .putObject({
      Bucket: 'your-avatars',
      Key: `avatars/${avatarId}.glb`,
      Body: buffer,
      ContentType: 'model/gltf-binary',
    })
    .promise()
}
```

## Benefits of Simplification

1. **Developer Experience**
   - Start everything with one command
   - Only 3 containers running locally
   - Uses 2GB RAM instead of 8GB
   - Faster startup (30 seconds vs 5 minutes)

2. **Operational Simplicity**
   - Fewer moving parts = fewer failures
   - Easier debugging (check 3 services, not 11)
   - Lower cloud costs (~$200/month vs $1000/month)
   - Single deployment unit

3. **Performance**
   - Less network hops
   - No serialization between microservices
   - PostgreSQL can handle 1000s of requests/second
   - Redis can handle 100k+ ops/second

4. **Still Scalable**
   - Can handle 100x your current load
   - Easy to add read replicas
   - Can split services later if needed
   - Cloud services handle scaling (S3, CloudFront)

## Migration Path

1. **Week 1**: Consolidate services into monolith
2. **Week 2**: Replace Kafka/RabbitMQ with BullMQ
3. **Week 3**: Move from Elasticsearch to PostgreSQL FTS
4. **Week 4**: Replace MinIO with S3/local storage
5. **Week 5**: Simplify deployment with single Docker image

## When to Add Complexity Back

Only add services when you have **proven** need:

- **Elasticsearch**: When you have 1M+ documents
- **Kafka**: When you need 10k+ events/second
- **Microservices**: When teams can't coordinate on monolith
- **Kubernetes**: When you have 50+ containers

For 20 customers with 200k requests/day, a well-designed monolith on a single beefy server (or 2-3 for redundancy) will handle everything beautifully.
