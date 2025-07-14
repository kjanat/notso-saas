import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { AuthenticationError } from '@saas/utils'
import type { JWTPayload } from '@saas/types'

const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
})

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload
  }
}

async function setupPlugins() {
  await fastify.register(helmet)
  
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true
  })

  await fastify.register(jwt, {
    secret: JWT_SECRET
  })

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'SaaS Chatbot API Gateway',
        description: 'API Gateway for multi-tenant chatbot platform',
        version: '1.0.0'
      },
      host: `localhost:${PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'tenants', description: 'Tenant management' },
        { name: 'chatbots', description: 'Chatbot operations' },
        { name: 'conversations', description: 'Conversation management' }
      ]
    }
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  })
}

fastify.decorate('authenticate', async function(request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch (err) {
    throw new AuthenticationError('Invalid or expired token')
  }
})

fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})

fastify.get('/', async (request, reply) => {
  return {
    name: 'SaaS Chatbot API Gateway',
    version: '1.0.0',
    docs: '/docs'
  }
})

fastify.setErrorHandler((error, request, reply) => {
  const { statusCode = 500, message } = error
  
  if (statusCode >= 500) {
    fastify.log.error(error)
  }

  reply.status(statusCode).send({
    success: false,
    error: {
      message,
      code: error.code || 'INTERNAL_ERROR',
      statusCode
    }
  })
})

async function start() {
  try {
    await setupPlugins()
    
    await fastify.listen({
      port: Number(PORT),
      host: '0.0.0.0'
    })
    
    fastify.log.info(`API Gateway running on port ${PORT}`)
    fastify.log.info(`Documentation available at http://localhost:${PORT}/docs`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()