#!/bin/bash
set -e

echo "🚀 Running post-start setup..."

# Clean up Git configuration to remove Windows paths
echo "🔧 Cleaning Git configuration..."
git config --global --unset-all safe.directory || true
git config --global --add safe.directory /workspace
git config --global --add safe.directory '*' 
echo "✅ Git configuration cleaned"

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL
until pg_isready -h postgres -U postgres > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Wait for Redis
until redis-cli -h redis -a redis_password ping | grep -q PONG; do
    echo "Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready"

# Wait for RabbitMQ
until curl -f http://rabbitmq:15672 > /dev/null 2>&1; do
    echo "Waiting for RabbitMQ..."
    sleep 2
done
echo "✅ RabbitMQ is ready"

# Wait for MinIO
until curl -f http://minio:9000/minio/health/live > /dev/null 2>&1; do
    echo "Waiting for MinIO..."
    sleep 2
done
echo "✅ MinIO is ready"

# Wait for Elasticsearch
until curl -f http://elasticsearch:9200/_cluster/health > /dev/null 2>&1; do
    echo "Waiting for Elasticsearch..."
    sleep 2
done
echo "✅ Elasticsearch is ready"

# Create MinIO buckets if they don't exist
echo "📦 Setting up MinIO buckets..."
export MC_HOST_minio=http://minioadmin:minioadmin@minio:9000

# Install mc (MinIO client) if not present
if ! command -v mc &> /dev/null; then
    # Create local bin directory if it doesn't exist
    mkdir -p ~/.local/bin
    curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o ~/.local/bin/mc
    chmod +x ~/.local/bin/mc
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        export PATH="$HOME/.local/bin:$PATH"
    fi
fi

# Create buckets
mc mb minio/avatars --ignore-existing
mc mb minio/uploads --ignore-existing
mc mb minio/exports --ignore-existing

# Set public policy for avatars bucket
mc anonymous set public minio/avatars

echo "✅ MinIO buckets configured"

# Create RabbitMQ exchanges and queues
echo "📨 Setting up RabbitMQ..."
curl -u admin:admin -X PUT http://rabbitmq:15672/api/vhosts/saas || true
curl -u admin:admin -X PUT http://rabbitmq:15672/api/permissions/saas/admin \
    -H "content-type: application/json" \
    -d '{"configure":".*","write":".*","read":".*"}' || true

echo "✅ RabbitMQ configured"

# Run database migrations if migration files exist
if [ -d "prisma" ] && [ -f "prisma/schema.prisma" ]; then
    echo "🗄️  Running database migrations..."
    pnpm prisma migrate dev --skip-generate || true
    pnpm prisma generate || true
    echo "✅ Database migrations completed"
fi

# Seed database if seed script exists
if [ -f "prisma/seed.ts" ] || [ -f "scripts/seed.ts" ]; then
    echo "🌱 Seeding database..."
    pnpm db:seed || true
    echo "✅ Database seeded"
fi

# Create Elasticsearch indices
echo "🔍 Setting up Elasticsearch indices..."
curl -X PUT "http://elasticsearch:9200/conversations" \
    -H 'Content-Type: application/json' \
    -d '{
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0
      },
      "mappings": {
        "properties": {
          "tenantId": { "type": "keyword" },
          "chatbotId": { "type": "keyword" },
          "visitorId": { "type": "keyword" },
          "messages": { "type": "text" },
          "sentiment": { "type": "float" },
          "createdAt": { "type": "date" }
        }
      }
    }' || true

curl -X PUT "http://elasticsearch:9200/analytics" \
    -H 'Content-Type: application/json' \
    -d '{
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0
      },
      "mappings": {
        "properties": {
          "tenantId": { "type": "keyword" },
          "eventType": { "type": "keyword" },
          "timestamp": { "type": "date" },
          "data": { "type": "object" }
        }
      }
    }' || true

echo "✅ Elasticsearch indices created"

# Display service URLs
echo ""
echo "✨ Development environment is ready!"
echo ""
echo "📍 Service URLs:"
echo "  PostgreSQL:      postgresql://postgres:postgres@postgres:5432/platform_db"
echo "  pgAdmin:         http://localhost:5050 (admin@example.com / admin)"
echo "  Redis:           redis://:redis_password@redis:6379"
echo "  Redis Commander: http://localhost:8081"
echo "  RabbitMQ:        http://localhost:15672 (admin / admin)"
echo "  MinIO Console:   http://localhost:9002 (minioadmin / minioadmin)"
echo "  Elasticsearch:   http://localhost:9200"
echo "  Mailhog:         http://localhost:8025"
echo ""
echo "🎯 Start developing with: pnpm dev"
echo ""
