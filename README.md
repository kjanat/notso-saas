# Multi-Tenant 3D Avatar AI Chatbot Platform

A production-ready SaaS platform enabling businesses to deploy multiple AI-powered 3D avatar chatbots, each with unique personalities, knowledge bases, and interactive behaviors. Built with TypeScript, Three.js, and microservices architecture.

## 🚀 Quick Start

### Using DevContainer (Recommended)

```bash
# Open in VS Code and reopen in container
# Or use GitHub Codespaces
# Everything will be auto-configured!
```

### Using Docker Compose

```bash
# Start all services
./scripts/dev-setup.sh

# In a new terminal, start the application
pnpm install
pnpm dev
```

### Manual Setup

See [detailed setup instructions](./docs/SETUP.md)

## 🏗️ Architecture

The platform uses a **Domain-Driven Design** approach with clear bounded contexts:

- **Tenant Management** - Multi-tenancy with multiple chatbots per tenant
- **Chatbot Configuration** - Individual 3D avatars, personalities, knowledge bases
- **Avatar System** - Three.js integration, ~20 animations, interactive behaviors
- **Conversation Engine** - Real-time chat with streaming AI responses
- **AI Processing** - Multi-provider support (OpenAI, Anthropic, Vertex)
- **Knowledge Base** - Vector embeddings, RAG, semantic search
- **Analytics** - Per-chatbot metrics, conversation tracking, cost analysis
- **Embed System** - Unique script generation for each chatbot

See [architecture documentation](./architecture/) for detailed design.

## 🛠️ Tech Stack

### Backend

- **Node.js + TypeScript** - Core services
- **PostgreSQL** - Multi-tenant data with complete isolation
- **Redis** - Caching, sessions, real-time pub/sub
- **RabbitMQ** - Message queuing for AI processing
- **Socket.io** - Real-time WebSocket communication
- **MinIO** - S3-compatible object storage

### Frontend

- **Three.js** - 3D avatar rendering with Blender model support
- **React** - Embeddable chat widget
- **Socket.io-client** - Real-time WebSocket communication
- **Emotion** - CSS-in-JS for widget styling
- **Next.js** - Admin dashboard (planned)

### AI/ML

- **OpenAI API** - GPT-4/GPT-3.5 for responses
- **Python + FastAPI** - AI service
- **Celery** - Distributed task processing

### Infrastructure

- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **Traefik** - API Gateway
- **Prometheus + Grafana** - Monitoring

## 📁 Project Structure

```tree
saas/
├── apps/                      # Microservices
│   ├── api-gateway/          # Main entry point, routing
│   ├── tenant-service/       # Tenant & subscription management
│   ├── chatbot-service/      # Chatbot configurations
│   ├── ai-service/           # AI provider integrations
│   ├── conversation-service/ # Real-time chat, WebSocket
│   ├── avatar-service/       # 3D model management [NEW]
│   └── knowledge-service/    # Knowledge base, RAG [NEW]
├── packages/shared/          # Shared packages
│   ├── types/               # TypeScript definitions
│   ├── domain/              # Domain models, business logic
│   ├── utils/               # Utilities, helpers
│   ├── database/            # Prisma schema
│   └── tsconfig/            # Shared TS configs
├── apps/frontend/           # Frontend apps [PLANNED]
│   ├── admin-dashboard/     # Tenant management UI
│   └── chat-widget/         # Embeddable 3D chat
├── architecture/            # Architecture docs
└── scripts/                 # Utility scripts
```

## 🔑 Key Features

### For Customers

- **Multiple Chatbots Per Tenant** - Deploy different avatars for different purposes
- **3D Interactive Avatars** - Blender models with ~20 animations
- **Unique Embed Scripts** - One script per chatbot for easy deployment
- **Context-Aware Behaviors** - Avatars react to page navigation, user actions
- **Sentiment-Based Animations** - Emotional responses to conversation tone
- **Knowledge Base Per Chatbot** - Separate training data for each avatar
- **Real-time Streaming** - Stream AI responses with synchronized animations
- **Interactive Behaviors** - Click, drag, hover interactions with avatars

### For Platform Admins

- **Multi-tenant Management** - Complete tenant isolation
- **Usage Analytics** - Platform-wide insights
- **Billing Integration** - Stripe subscription management
- **Security Controls** - GDPR compliance, audit logs
- **System Monitoring** - Health checks, alerts
- **3D Model Library** - Manage avatar assets

### Technical Features

- **Horizontal Scaling** - Handle thousands of concurrent chats
- **Cost Control** - OpenAI API budget limits per tenant
- **High Availability** - Zero-downtime deployments
- **Data Isolation** - Database per tenant
- **Event Sourcing** - Complete audit trail
- **Response Caching** - 80%+ cache hit rate
- **Legacy Support** - CSV import for existing data

## 🚦 Development Workflow

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start development servers
pnpm dev

# Run tests
pnpm test

# Lint and type check
pnpm lint
pnpm type-check
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

## 📊 Monitoring

The platform includes comprehensive monitoring:

- **Metrics** - Prometheus + Grafana dashboards
- **Logging** - Structured logs with Elasticsearch
- **Tracing** - Distributed tracing with Jaeger
- **Alerts** - PagerDuty integration

Access monitoring dashboards:

- Grafana: http://localhost:3000
- Jaeger: http://localhost:16686
- Kibana: http://localhost:5601

## 🔒 Security

- **JWT Authentication** with refresh tokens
- **Role-Based Access Control** (RBAC)
- **API Rate Limiting** per tenant
- **Input Validation** and sanitization
- **HTTPS Only** in production
- **Security Headers** (CORS, CSP, etc.)
- **Audit Logging** for compliance
- **Data Encryption** at rest and in transit

## 🚀 Deployment

### Development

```bash
docker-compose up -d
pnpm dev
```

### Production

```bash
# Build containers
docker build -t saas/api:latest ./packages/api
docker build -t saas/web:latest ./apps/customer-portal

# Deploy to Kubernetes
kubectl apply -f kubernetes/

# Or use Helm
helm install saas-platform ./helm/saas-platform
```

See [deployment guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 📈 Performance

Target metrics:

- **Response Time** < 100ms (p95)
- **WebSocket Latency** < 50ms
- **AI Response** < 2s (including generation)
- **Concurrent Users** 10,000+ per instance
- **Message Throughput** 1,000 msg/sec
- **Uptime** 99.9%

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- Documentation: [/docs](./docs/)
- Architecture: [/architecture](./architecture/)
- Issues: [GitHub Issues](https://github.com/your-org/saas-chatbot/issues)
- Email: support@your-saas.com

## 🎯 Roadmap

### Phase 1: MVP (16-20 weeks)

- 🔄 Single 3D avatar with basic animations
- 🔄 Core chat functionality with AI
- 🔄 Basic Three.js integration
- 🔄 Simple embed script

### Phase 2: Multi-Chatbot (24-28 weeks)

- 📋 Multiple chatbots per tenant
- 📋 Full animation library (~20 animations)
- 📋 Knowledge base system
- 📋 Embed script generator

### Phase 3: Advanced Features (32-36 weeks)

- 📋 Sentiment analysis integration
- 📋 Interactive behaviors (click, drag)
- 📋 Context-aware responses
- 📋 Avatar marketplace

### Phase 4: Production (40-44 weeks)

- 📋 Performance optimization
- 📋 Mobile fallbacks
- 📋 Analytics dashboard
- 📋 Cost tracking per chatbot
