# DevContainer Development Environment

This folder contains the configuration for a fully-featured development container that provides a consistent, reproducible development environment for the SaaS Chatbot Platform.

## Features

### 🛠️ Pre-installed Development Tools
- **Node.js 20** with pnpm, TypeScript, and essential build tools
- **Python 3.11** with FastAPI, Celery, and AI/ML libraries
- **Database clients** for PostgreSQL, Redis, and MongoDB
- **DevOps tools** including Docker, Kubernetes (kubectl, Helm, k9s), and Terraform
- **Code quality tools** like ESLint, Prettier, Black, and pre-commit hooks

### 📦 Integrated Services
All backend services run within the container network:
- PostgreSQL 16 (Multi-tenant database)
- Redis 7 (Caching & queues)
- RabbitMQ (Message broker)
- MinIO (S3-compatible storage)
- Elasticsearch (Search & analytics)
- Kafka (Event streaming)
- Mailhog (Email testing)

### 🚀 VS Code Extensions
Automatically installs 40+ extensions including:
- Language support (TypeScript, Python, YAML)
- Framework tools (React, Next.js, Prisma)
- Testing (Jest, Playwright)
- Database management
- Git enhancements
- AI assistants (GitHub Copilot)

## Quick Start

### Option 1: Using VS Code
1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the project folder in VS Code
3. Click the popup "Reopen in Container" or use Command Palette → "Dev Containers: Reopen in Container"
4. Wait for the container to build (first time takes ~5-10 minutes)
5. The post-create script will automatically set up the environment

### Option 2: Using GitHub Codespaces
1. Click "Code" → "Codespaces" → "Create codespace on main"
2. Wait for the environment to initialize
3. All services and tools will be pre-configured

### Option 3: Using CLI
```bash
# Install Dev Container CLI
npm install -g @devcontainers/cli

# Build and start the container
devcontainer up --workspace-folder .

# Execute commands in the container
devcontainer exec --workspace-folder . pnpm install
devcontainer exec --workspace-folder . pnpm dev
```

## Post-Setup

After the container starts, the following will be automatically configured:
- ✅ All npm dependencies installed
- ✅ Database migrations applied
- ✅ MinIO buckets created
- ✅ RabbitMQ exchanges configured
- ✅ Elasticsearch indices set up
- ✅ Git safe directory configured

## Available Commands

```bash
# Development
pnpm dev              # Start all services
pnpm dev:api          # Start API service only
pnpm dev:web          # Start customer portal
pnpm dev:admin        # Start admin portal

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm test:coverage    # Generate coverage report

# Code Quality
pnpm lint             # Lint code
pnpm type-check       # TypeScript type checking
pnpm format           # Format code with Prettier

# Infrastructure
dc up -d              # Start Docker services
dc logs -f [service]  # View service logs
dc down               # Stop services
k get pods            # List Kubernetes pods
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| API Gateway | http://localhost:3000 | - |
| Customer Portal | http://localhost:3001 | - |
| Platform Admin | http://localhost:3002 | - |
| pgAdmin | http://localhost:5050 | admin@example.com / admin |
| Redis Commander | http://localhost:8081 | - |
| RabbitMQ Management | http://localhost:15672 | admin / admin |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Elasticsearch | http://localhost:9200 | - |
| Mailhog | http://localhost:8025 | - |

## Troubleshooting

### Container won't start
```bash
# Clean up and rebuild
docker-compose -f .devcontainer/docker-compose.yml down -v
docker system prune -af
# Then reopen in container
```

### Services not accessible
```bash
# Check service health
docker-compose -f .devcontainer/docker-compose.yml ps
docker-compose -f .devcontainer/docker-compose.yml logs [service-name]
```

### Permission issues
```bash
# Fix ownership
sudo chown -R $(id -u):$(id -g) .
```

### Port conflicts
If you have services running locally that conflict with container ports, either:
1. Stop the local services
2. Or modify the port mappings in `.devcontainer/docker-compose.yml`

## Customization

### Adding new tools
Edit `.devcontainer/Dockerfile` to add system packages or global npm packages.

### VS Code settings
Modify `.devcontainer/devcontainer.json` to add extensions or change settings.

### Environment variables
Add them to `.env.local` (created automatically) or modify `.devcontainer/docker-compose.yml`.

## Performance Tips

1. **Allocate enough resources** to Docker Desktop (recommended: 8GB RAM, 4 CPUs)
2. **Use named volumes** for node_modules to improve performance
3. **Enable BuildKit** for faster builds: `export DOCKER_BUILDKIT=1`
4. **Use WSL2** on Windows for better performance

## Security Notes

- Default passwords are for development only
- The container runs as non-root user (vscode)
- Secrets in `.env.local` are gitignored
- Network isolation between services

## Contributing

When adding new services or tools:
1. Update `.devcontainer/docker-compose.yml` for new services
2. Add initialization to `.devcontainer/post-start.sh`
3. Document the service in this README
4. Add the service URL to the table above