import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from './auth.service.js'

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
      user: result.user,
      token: await reply.jwtSign({
        id: result.user.id,
        email: result.user.email,
        tenantId: result.user.tenantId,
      }),
    }
  }

  async register(request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) {
    const user = await this.authService.register(request.body)

    return {
      user,
      token: await reply.jwtSign({
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
      }),
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
    // In a real app, you might want to blacklist the token
    return { message: 'Logged out successfully' }
  }
}
