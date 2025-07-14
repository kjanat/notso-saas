# Deployment Guide

## Production Build

1. **Build all services**

   ```bash
   pnpm build
   ```

2. **Build Docker images**
   ```bash
   docker build -t saas/api:latest -f apps/api/Dockerfile .
   docker build -t saas/worker:latest -f apps/worker/Dockerfile .
   docker build -t saas/websocket:latest -f apps/websocket/Dockerfile .
   ```

## Deployment Options

### Option 1: Docker Compose (Simple)

Best for: Single server deployments, small teams

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes (Scalable)

Best for: Multi-server deployments, auto-scaling needs

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: saas-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: saas-api
  template:
    metadata:
      labels:
        app: saas-api
    spec:
      containers:
        - name: api
          image: saas/api:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: saas-secrets
                  key: database-url
```

Apply with:

```bash
kubectl apply -f k8s/
```

### Option 3: Cloud Platforms

**AWS ECS**

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
docker tag saas/api:latest $ECR_URI/saas/api:latest
docker push $ECR_URI/saas/api:latest

# Deploy with ECS CLI or Terraform
ecs-cli compose up
```

**Google Cloud Run**

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/$PROJECT_ID/saas-api
gcloud run deploy saas-api --image gcr.io/$PROJECT_ID/saas-api
```

## Environment Configuration

### Production Environment Variables

```env
# Infrastructure
DATABASE_URL=postgresql://user:pass@db.example.com:5432/saas_prod
REDIS_URL=redis://:password@redis.example.com:6379

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-32>
CORS_ORIGINS=https://app.example.com,https://www.example.com

# API Keys
OPENAI_API_KEY=sk-prod-...
ANTHROPIC_API_KEY=sk-ant-prod-...

# Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
S3_BUCKET=saas-avatars-prod

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# Performance
NODE_ENV=production
API_RATE_LIMIT=100
WORKER_CONCURRENCY=10
```

### SSL/TLS Configuration

Using Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Setup

### Production Database

1. **Create database**

   ```sql
   CREATE DATABASE saas_production;
   CREATE USER saas_user WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE saas_production TO saas_user;
   ```

2. **Run migrations**

   ```bash
   DATABASE_URL=postgresql://... pnpm db:migrate deploy
   ```

3. **Enable extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
   ```

### Backup Strategy

Daily automated backups:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > backup_$DATE.sql.gz
aws s3 cp backup_$DATE.sql.gz s3://backups/db/
```

## Monitoring

### Health Checks

All services expose health endpoints:

- API: `GET /health`
- Worker: `GET /health`
- WebSocket: `GET /health`

### Logging

Structured JSON logs sent to centralized logging:

```javascript
// Automatic with pino logger
{
  "level": 30,
  "time": 1674123456789,
  "msg": "Request completed",
  "req": { "method": "GET", "url": "/api/chatbots" },
  "res": { "statusCode": 200 },
  "responseTime": 123
}
```

### Metrics

Key metrics to monitor:

- API response time (p50, p95, p99)
- Database connection pool usage
- Redis memory usage
- Queue job processing time
- WebSocket concurrent connections
- AI API token usage

## Scaling Considerations

### Horizontal Scaling

1. **API Service**: Scale based on CPU/memory
2. **Worker Service**: Scale based on queue depth
3. **WebSocket Service**: Scale with sticky sessions

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_chatbots_tenant_id ON chatbots(tenant_id);
CREATE INDEX idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Partition large tables
CREATE TABLE messages_2024_01 PARTITION OF messages
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Caching Strategy

```typescript
// Cache tenant data (5 minutes)
const tenant = (await cache.get(`tenant:${id}`)) || (await db.tenant.findById(id))

// Cache chatbot configs (10 minutes)
const chatbot = (await cache.get(`chatbot:${id}`)) || (await db.chatbot.findById(id))
```

## Security Checklist

- [ ] All secrets in environment variables
- [ ] SSL/TLS enabled on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Database connections use SSL
- [ ] Regular security updates
- [ ] API keys rotated regularly
- [ ] Logs don't contain sensitive data
- [ ] Backups encrypted at rest

## Rollback Procedure

1. **Tag releases**

   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3"
   docker tag saas/api:latest saas/api:v1.2.3
   ```

2. **Quick rollback**

   ```bash
   # Revert to previous version
   docker-compose down
   docker-compose up -d --image saas/api:v1.2.2
   ```

3. **Database rollback**
   ```bash
   # Only if schema changed
   pnpm db:migrate undo
   ```
