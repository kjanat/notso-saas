#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting SaaS Platform Development Environment...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directory structure...${NC}"
mkdir -p docker/postgres
mkdir -p docker/traefik
mkdir -p logs
mkdir -p data/minio
mkdir -p data/elasticsearch

# Make postgres init script executable
chmod +x docker/postgres/init-multi-db.sh

# Check if .env.local exists, if not create from template
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}📝 Creating .env.local file...${NC}"
    cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/platform_db"
TENANT_DATABASE_HOST="localhost"
TENANT_DATABASE_PORT="5432"

# Redis
REDIS_URL="redis://:redis_password@localhost:6379"

# RabbitMQ
RABBITMQ_URL="amqp://admin:admin@localhost:5672"

# MinIO (S3)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET_AVATARS="avatars"
S3_BUCKET_UPLOADS="uploads"
S3_BUCKET_EXPORTS="exports"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# API Keys
OPENAI_API_KEY="your-openai-api-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Email (Mailhog for development)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""

# Application
NODE_ENV="development"
PORT="3000"
CUSTOMER_PORTAL_PORT="3001"
PLATFORM_ADMIN_PORT="3002"

# Domains
API_DOMAIN="http://localhost"
CUSTOMER_PORTAL_DOMAIN="http://localhost:3001"
PLATFORM_ADMIN_DOMAIN="http://localhost:3002"
WEBSOCKET_URL="ws://localhost:3008"

# Feature Flags
ENABLE_LEGACY_CSV_IMPORT="true"
ENABLE_3D_AVATARS="true"
ENABLE_ANALYTICS="true"
EOF
    echo -e "${GREEN}✅ Created .env.local file${NC}"
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down

# Start infrastructure services
echo -e "${YELLOW}🏗️  Starting infrastructure services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check PostgreSQL
until docker exec saas-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Check Redis
until docker exec saas-redis redis-cli -a redis_password ping | grep -q PONG; do
    echo -e "${YELLOW}Waiting for Redis...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Redis is ready${NC}"

# Check RabbitMQ
until docker exec saas-rabbitmq rabbitmq-diagnostics -q ping > /dev/null 2>&1; do
    echo -e "${YELLOW}Waiting for RabbitMQ...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ RabbitMQ is ready${NC}"

# Check MinIO
until curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    echo -e "${YELLOW}Waiting for MinIO...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ MinIO is ready${NC}"

# Check Elasticsearch
until curl -f http://localhost:9200/_cluster/health > /dev/null 2>&1; do
    echo -e "${YELLOW}Waiting for Elasticsearch...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Elasticsearch is ready${NC}"

# Create MinIO buckets
echo -e "${YELLOW}📦 Creating MinIO buckets...${NC}"
docker run --rm --network saas-network \
    -e MC_HOST_minio=http://minioadmin:minioadmin@minio:9000 \
    minio/mc:latest \
    bash -c "
        mc mb minio/avatars || true
        mc mb minio/uploads || true
        mc mb minio/exports || true
        mc anonymous set public minio/avatars
    "
echo -e "${GREEN}✅ MinIO buckets created${NC}"

# Create RabbitMQ exchanges and queues
echo -e "${YELLOW}📨 Setting up RabbitMQ...${NC}"
docker exec saas-rabbitmq rabbitmqctl add_vhost saas || true
docker exec saas-rabbitmq rabbitmqctl set_permissions -p saas admin ".*" ".*" ".*" || true
echo -e "${GREEN}✅ RabbitMQ configured${NC}"

# Show service URLs
echo -e "${GREEN}✨ Development environment is ready!${NC}"
echo ""
echo -e "${GREEN}📍 Service URLs:${NC}"
echo -e "  ${YELLOW}PostgreSQL:${NC}      postgresql://postgres:postgres@localhost:5432/platform_db"
echo -e "  ${YELLOW}pgAdmin:${NC}         http://localhost:5050 (admin@example.com / admin)"
echo -e "  ${YELLOW}Redis:${NC}           redis://:redis_password@localhost:6379"
echo -e "  ${YELLOW}Redis Commander:${NC} http://localhost:8081"
echo -e "  ${YELLOW}RabbitMQ:${NC}        http://localhost:15672 (admin / admin)"
echo -e "  ${YELLOW}MinIO Console:${NC}   http://localhost:9001 (minioadmin / minioadmin)"
echo -e "  ${YELLOW}Elasticsearch:${NC}   http://localhost:9200"
echo -e "  ${YELLOW}Mailhog:${NC}         http://localhost:8025"
echo -e "  ${YELLOW}Traefik:${NC}         http://localhost:8888"
echo ""
echo -e "${GREEN}🎯 Next steps:${NC}"
echo -e "  1. Install dependencies: ${YELLOW}pnpm install${NC}"
echo -e "  2. Run database migrations: ${YELLOW}pnpm migrate:dev${NC}"
echo -e "  3. Seed development data: ${YELLOW}pnpm seed:dev${NC}"
echo -e "  4. Start development servers: ${YELLOW}pnpm dev${NC}"
echo ""
echo -e "${GREEN}💡 Tips:${NC}"
echo -e "  - View logs: ${YELLOW}docker-compose logs -f [service-name]${NC}"
echo -e "  - Stop services: ${YELLOW}docker-compose down${NC}"
echo -e "  - Reset everything: ${YELLOW}docker-compose down -v${NC}"