import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AuthService } from './auth.service.js'

interface LoginBody {
  email: string
  password: string
}

interface RegisterBody extends LoginBody {
  tenantId: string
  name?: string
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
    const { email, password } = request.body
    const result = await this.authService.login(email, password)

    if (!result) {
      return reply.status(401).send({ message: 'Invalid credentials' })
    }

    return {
      token: await reply.jwtSign({
        email: result.user.email,
        id: result.user.id,
        tenantId: result.user.tenantId,
      }),
      user: result.user,
    }
  }

  async register(request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) {
    const user = await this.authService.register(request.body)

    return {
      token: await reply.jwtSign({
        email: user.email,
        id: user.id,
        tenantId: user.tenantId,
      }),
      user,
    }
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id
    const user = await this.authService.getUserById(userId)

    if (!user) {
      return reply.status(404).send({ message: 'User not found' })
    }

    return user
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    // Log the logout event
    const userId = request.user?.id
    if (userId) {
      this.logger.info('User logged out', { userId })
    }

    // In production, you might want to:
    // - Blacklist the token in Redis
    // - Clear any server-side sessions
    // - Emit logout event for analytics

    reply.code(200).send({ message: 'Logged out successfully' })
  }
}
