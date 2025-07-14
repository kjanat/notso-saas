import { FastifyPluginAsync } from 'fastify'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'

export const authModule: FastifyPluginAsync = async fastify => {
  const authService = new AuthService()
  const authController = new AuthController(authService)

  // Public routes
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: authController.login.bind(authController),
  })

  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'tenantId'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          tenantId: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    handler: authController.register.bind(authController),
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
