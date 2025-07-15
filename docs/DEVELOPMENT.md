# Development Guide

## Prerequisites

- Node.js 22.0+ (with corepack enabled)
- pnpm 10.0+
- Docker & Docker Compose
- PostgreSQL client (optional, for debugging)

## Initial Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd saas
   pnpm install
   ```

2. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Infrastructure**

   ```bash
   docker-compose up -d
   # Starts PostgreSQL, Redis, MinIO
   ```

4. **Database Setup**

   ```bash
   pnpm db:push    # Create schema
   pnpm db:seed    # Add test data
   ```

5. **Start Development**
   ```bash
   pnpm dev        # Starts all services
   ```

## Common Tasks

### Working with Services

```bash
# Run specific service
pnpm dev --filter=@saas/api

# Build specific package
pnpm build --filter=@saas/types

# Run tests for a service
pnpm test --filter=@saas/api

# Add dependency to specific workspace
pnpm add fastify --filter=@saas/api
```

### Database Operations

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Create and apply migrations
pnpm db:migrate

# Open Prisma Studio (GUI)
pnpm db:studio

# Reset database
pnpm db:push --force-reset
```

### Code Quality

```bash
# Run all checks
pnpm lint && pnpm type-check && pnpm test

# Format code
pnpm format

# Type checking only
pnpm type-check

# Run tests in watch mode
pnpm test:watch
```

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_chatbot

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=change-this-in-production

# API Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional Variables

```env
# Service Ports
API_PORT=3000
WEBSOCKET_PORT=3001

# Logging
LOG_LEVEL=debug

# File Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=avatars

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_RATE_LIMITING=true

# Queue Configuration
QUEUE_PREFIX=bull                    # Redis queue key prefix (default: bull)
AI_QUEUE_NAME=ai-processing          # AI processing queue name (default: ai-processing)

# Database Seeding (Development Only)
ADMIN_PASSWORD=your-secure-password  # Admin user password for seed script
DEMO_PASSWORD=your-demo-password     # Demo user password for seed script
```

## Project Structure

```
apps/
├── api/              # Main API service
│   ├── src/
│   │   ├── modules/  # Business modules (DDD)
│   │   ├── domain/   # Domain models
│   │   └── shared/   # Shared utilities
│   └── package.json
├── worker/           # Background jobs
└── websocket/        # Real-time server

packages/
├── database/         # Prisma schema & client
├── domain/           # Shared domain logic
├── types/            # TypeScript types
└── utils/            # Common utilities
```

## Debugging

### VS Code Launch Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug API",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev", "--filter=@saas/api"],
  "skipFiles": ["<node_internals>/**"],
  "console": "integratedTerminal"
}
```

### Common Issues

**Port Already in Use**

```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

**Database Connection Failed**

```bash
# Check if PostgreSQL is running
docker ps
# Check logs
docker logs saas-postgres
# Test connection
psql $DATABASE_URL
```

**Type Errors After Changes**

```bash
# Rebuild packages
pnpm build
# Regenerate Prisma client
pnpm db:generate
```

## Git Workflow

1. **Feature Branch**

   ```bash
   git checkout -b feat/your-feature
   ```

2. **Commit with Conventional Commits**

   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

3. **Before Pushing**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

## Performance Tips

- Use `--filter` to run only what you need
- Enable TypeScript incremental builds
- Use `pnpm dev` for hot reloading
- Profile with `clinic` or `0x` for bottlenecks

## Useful Scripts

```bash
# Clean all build artifacts
pnpm clean

# Fresh install
rm -rf node_modules pnpm-lock.yaml && pnpm install

# Update all dependencies
pnpm update -r

# Check for outdated packages
pnpm outdated -r
```
