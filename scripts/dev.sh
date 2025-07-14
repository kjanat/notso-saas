#!/bin/bash
# Simple development environment starter

set -e

echo "🚀 Starting simplified development environment..."

# Create data directories if they don't exist
mkdir -p data/postgres data/redis data/uploads

# Stop any running containers
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# Start only essential services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres; do
  sleep 1
done

# Run database migrations
echo "🔧 Running database setup..."
pnpm db:generate
pnpm db:push

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
fi

# Start the application
echo "🎯 Starting application..."
pnpm dev

# Cleanup on exit
trap "docker-compose -f docker-compose.dev.yml down" EXIT