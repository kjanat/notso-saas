# Architecture Overview

## System Design

The platform uses a **modular monolith** architecture, chosen for simplicity and maintainability while supporting future scaling needs.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│   API Gateway   │────▶│    PostgreSQL   │
│   (Three.js)    │     │   (Fastify)     │     │   (Primary DB)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       ├─────────────────────────┐
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    WebSocket    │     │     Worker      │     │      Redis      │
│   (Socket.io)   │     │    (BullMQ)     │     │  (Cache/Queue)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Core Modules

### API Service (`apps/api`)

Modular structure with Domain-Driven Design:

- **Tenant Module** - Multi-tenancy management
- **Chatbot Module** - 3D avatar configuration
- **Conversation Module** - Chat session handling
- **AI Module** - LLM provider abstraction
- **Auth Module** - JWT authentication
- **Analytics Module** - Usage tracking

### Worker Service (`apps/worker`)

Background job processing:

- AI response generation
- Knowledge base indexing
- Analytics aggregation
- Email notifications

### WebSocket Service (`apps/websocket`)

Real-time features:

- Chat message streaming
- Avatar state updates
- Presence management

## Key Design Patterns

### 1. Dependency Injection

Using TSyringe for IoC container:

```typescript
@injectable()
export class TenantService {
  constructor(
    @inject('ITenantRepository') private repo: ITenantRepository,
    @inject('ICacheService') private cache: ICacheService
  ) {}
}
```

### 2. Repository Pattern

Data access abstraction:

```typescript
interface ITenantRepository {
  create(data: CreateTenantDto): Promise<Tenant>
  findById(id: string): Promise<Tenant | null>
}
```

### 3. Domain Models

Rich domain entities with business logic:

```typescript
export class Tenant extends AggregateRoot<TenantProps> {
  canCreateChatbot(): boolean {
    return this.props.currentChatbots < this.props.maxChatbots
  }
}
```

### 4. Factory Pattern

For AI provider abstraction:

```typescript
const provider = aiFactory.create('openai')
const response = await provider.generateResponse(messages)
```

## Data Flow

1. **Client Request** → API Gateway (auth, validation)
2. **Business Logic** → Domain services process request
3. **Data Access** → Repository pattern for DB operations
4. **Background Jobs** → Queue async tasks to worker
5. **Real-time Updates** → Broadcast via WebSocket
6. **Response** → Return to client

## Technology Stack

- **Runtime**: Node.js 22+ with ES modules
- **Language**: TypeScript 5.8 (strict mode)
- **API Framework**: Fastify (high performance)
- **Database**: PostgreSQL 16 (with pgvector)
- **Cache/Queue**: Redis 8 + BullMQ
- **ORM**: Prisma (type-safe queries)
- **Real-time**: Socket.io
- **File Storage**: MinIO (S3-compatible)
- **Monorepo**: Turborepo + pnpm workspaces

## Scaling Strategy

Current architecture supports 200k requests/day with room to scale:

1. **Vertical Scaling**: Increase API server resources
2. **Horizontal Scaling**: Add more worker instances
3. **Database Scaling**: Read replicas, connection pooling
4. **Caching Layer**: Redis for frequently accessed data
5. **CDN**: Static assets and 3D models

Future migration path if needed:

- Extract modules into microservices
- Add API gateway (Kong/Traefik)
- Implement service mesh
