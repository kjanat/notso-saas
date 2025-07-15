import type { FastifyReply, FastifyRequest } from 'fastify'
import { logger } from '../../shared/utils/logger.js'
import type { AuthService } from './auth.service.js'
import type { LoginResponse, RegisterResponse, UserProfile } from './auth.types.js'

interface LoginBody {
  email: string
  password: string
  tenantId?: string // Optional tenant selection
}

interface RegisterBody extends LoginBody {
  tenantId: string
  name?: string
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ): Promise<
    | { token: string; user: LoginResponse['user'] }
    | { message: string; availableTenants?: Array<{ id: string; name: string; slug: string }> }
    | { message: string }
  > {
    const { email, password, tenantId } = request.body
    const result = await this.authService.login({ email, password, tenantId })

    if (!result) {
      return reply.status(401).send({ message: 'Invalid credentials' })
    }

    // Check if tenant selection is required
    if (result.availableTenants) {
      return {
        availableTenants: result.availableTenants,
        message: 'Multiple tenants available. Please select a tenant.',
      }
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

  async register(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply
  ): Promise<{ token: string; user: RegisterResponse }> {
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

  async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<UserProfile | { message: string }> {
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
      logger.info('User logged out', { userId })
    }

    // In production, you might want to:
    // - Blacklist the token in Redis
    // - Clear any server-side sessions
    // - Emit logout event for analytics

    reply.code(200).send({ message: 'Logged out successfully' })
  }
}
