import 'reflect-metadata'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'

import { config } from './config/index.js'
import { registerModules } from './modules/index.js'
import { setupCache } from './shared/cache/index.js'
import { setupDatabase } from './shared/database/index.js'
import { setupContainer } from './shared/di/container.js'
import { setupQueues } from './shared/queue/index.js'
import { logger } from './shared/utils/logger.js'

async function bootstrap() {
  // Initialize DI container
  setupContainer()

  // Initialize infrastructure
  await setupDatabase()
  await setupCache()
  await setupQueues()

  // Create Fastify instance
  const app = Fastify({
    logger,
    trustProxy: true,
  })

  // Register core plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  })

  await app.register(cors, {
    credentials: true,
    origin: config.cors.origins,
  })

  await app.register(jwt, {
    secret: config.jwt.secret,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // API Documentation
  if (config.env !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          description: 'API for multi-tenant 3D avatar chatbot platform',
          title: 'SaaS 3D Avatar Chatbot API',
          version: '1.0.0',
        },
        servers: [{ url: config.api.url }],
      },
    })

    await app.register(swaggerUi, {
      routePrefix: '/docs',
    })
  }

  // Register all modules
  await registerModules(app)

  // Health check
  app.get('/health', async () => ({
    environment: config.env,
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  // Start server
  try {
    await app.listen({
      host: '0.0.0.0',
      port: config.api.port,
    })
    logger.info(`Server listening on http://0.0.0.0:${config.api.port}`)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

bootstrap().catch(err => {
  logger.error(err)
  process.exit(1)
})
