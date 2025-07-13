# SaaS Chatbot Platform

A multi-tenant SaaS platform for AI-powered customer service chatbots with 3D avatars, real-time chat, sentiment analysis, and comprehensive analytics.

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

- **Tenant Management** - Multi-tenancy, subscriptions, billing
- **Chatbot Configuration** - Bot instances, avatars, personalities
- **Conversation Engine** - Real-time chat, message routing
- **AI Processing** - NLP, sentiment analysis, response generation
- **Analytics** - Metrics, reporting, insights
- **Platform Administration** - System-wide controls, security

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
- **Next.js** - Customer and admin portals
- **Three.js** - 3D avatar rendering
- **Tailwind CSS** - Styling
- **React Query** - Data fetching

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

```
saas/
├── packages/              # Shared packages (monorepo)
│   ├── api/              # Main API service
│   ├── auth-service/     # Authentication microservice
│   ├── ai-service/       # AI processing service
│   ├── websocket/        # Real-time service
│   ├── shared/           # Shared types and utils
│   └── database/         # Schemas and migrations
├── apps/                 # Applications
│   ├── customer-portal/  # Customer dashboard
│   ├── platform-admin/   # Admin dashboard
│   └── chat-widget/      # Embeddable widget
├── docker/               # Docker configurations
├── kubernetes/           # K8s manifests
├── architecture/         # Architecture docs
└── scripts/              # Utility scripts
```

## 🔑 Key Features

### For Customers
- **Embeddable Chat Widget** - Simple JavaScript snippet
- **3D Avatars** - Customizable Three.js avatars
- **Real-time Chat** - Sub-second response times
- **Sentiment Analysis** - Understand customer emotions
- **Conversation Analytics** - Detailed insights
- **Team Management** - Role-based permissions
- **Webhook Integration** - Real-time events

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

### Phase 1 (Current)
- ✅ Core chat functionality
- ✅ Multi-tenant architecture
- ✅ Basic 3D avatars
- ✅ OpenAI integration

### Phase 2
- 🔄 Voice chat support
- 🔄 Advanced analytics
- 🔄 Mobile SDKs
- 🔄 More AI providers

### Phase 3
- 📋 Multi-language support
- 📋 Custom AI training
- 📋 Advanced avatar animations
- 📋 Marketplace for avatars

---

Built with ❤️ for the future of customer service