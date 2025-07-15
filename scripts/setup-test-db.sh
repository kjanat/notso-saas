#!/bin/bash
# Setup test database for CI/CD

set -e

echo "Setting up test database..."

# Use DATABASE_URL if provided, otherwise use default
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/postgres"}

# Extract connection parameters
DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_USER=$(echo $DATABASE_URL | sed -E 's/.*\/\/([^:]+):.*/\1/')
DB_PASS=$(echo $DATABASE_URL | sed -E 's/.*\/\/[^:]+:([^@]+)@.*/\1/')

# Create test database
export PGPASSWORD=$DB_PASS

# Check if test database exists, create if not
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'saas_platform_test'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE saas_platform_test"

echo "Test database setup complete!"

# Run Prisma migrations on test database
export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/saas_platform_test"
pnpm db:push

echo "Test database migrations complete!"