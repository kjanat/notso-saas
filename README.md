# SaaS 3D Avatar Chatbot Platform

A multi-tenant SaaS platform for AI-powered 3D avatar chatbots. Clean monolith architecture with TypeScript, Fastify, and Three.js.

## Quick Start

```bash
# Prerequisites: Node.js 22+, pnpm, Docker

# 1. Clone and install
git clone https://github.com/kjanat/notso-saas.git
cd saas
pnpm install

# 2. Start infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d

# 3. Setup database
pnpm db:push
pnpm db:seed

# 4. Start development
pnpm dev
```

## Architecture

**Modular Monolith** with three main services:

- **API** (`apps/api`) - Main business logic with DDD modules
- **Worker** (`apps/worker`) - Background jobs (AI processing, analytics)
- **WebSocket** (`apps/websocket`) - Real-time chat communication

**Infrastructure**: PostgreSQL, Redis, MinIO (S3-compatible storage)

## Key Features

- 🏢 **Multi-tenant** - Multiple tenants with isolated data
- 🤖 **Multiple Chatbots** - Each tenant can create multiple 3D avatar chatbots
- 🎭 **3D Avatars** - Three.js powered interactive characters
- 🧠 **AI Integration** - OpenAI, Anthropic, Vertex AI support
- 📚 **Knowledge Bases** - Per-chatbot document storage and RAG
- 💬 **Real-time Chat** - WebSocket streaming responses
- 📊 **Analytics** - Conversation tracking and metrics

## Development

```bash
# Run specific service
pnpm dev --filter=@saas/api

# Run tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint

# Build for production
pnpm build
```

## Project Structure

```
saas/
├── apps/
│   ├── api/          # Main API (Fastify + TypeScript)
│   ├── worker/       # Background jobs (BullMQ)
│   └── websocket/    # Real-time server (Socket.io)
├── packages/
│   ├── database/     # Prisma schema and client
│   ├── domain/       # Domain models and business logic
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Common utilities
└── docs/             # Developer documentation
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_chatbot
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full configuration.

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

Proprietary - All rights reserved
