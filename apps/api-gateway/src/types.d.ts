import { JWTPayload } from '@saas/types'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>
  }
}
