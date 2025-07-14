import type { FastifyPluginAsync } from 'fastify'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'

export const authModule: FastifyPluginAsync = async fastify => {
  const authService = new AuthService()
  const authController = new AuthController(authService)

  // Public routes
  fastify.post('/login', {
    handler: authController.login.bind(authController),
    schema: {
      body: {
        properties: {
          email: { format: 'email', type: 'string' },
          password: { minLength: 8, type: 'string' },
        },
        required: ['email', 'password'],
        type: 'object',
      },
    },
  })

  fastify.post('/register', {
    handler: authController.register.bind(authController),
    schema: {
      body: {
        properties: {
          email: { format: 'email', type: 'string' },
          name: { type: 'string' },
          password: { minLength: 8, type: 'string' },
          tenantId: { type: 'string' },
        },
        required: ['email', 'password', 'tenantId'],
        type: 'object',
      },
    },
  })

  // Protected routes
  fastify.register(async protectedRoutes => {
    // Add authentication preHandler
    protectedRoutes.addHook('preHandler', async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    })

    protectedRoutes.get('/me', authController.getProfile.bind(authController))
    protectedRoutes.post('/logout', authController.logout.bind(authController))
  })
}
