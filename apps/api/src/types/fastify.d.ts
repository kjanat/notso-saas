import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      email: string
      tenantId: string
    }
    user: {
      id: string
      email: string
      tenantId: string
    }
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      email: string
      tenantId: string
    }
  }
}
