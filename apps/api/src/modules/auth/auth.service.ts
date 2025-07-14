import { getDatabase } from '../../shared/database/index.js'
import bcrypt from 'bcryptjs'
import { logger } from '../../shared/utils/logger.js'

export class AuthService {
  private get db() {
    return getDatabase()
  }

  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({
      where: { email },
      include: { tenant: true },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null
    }

    logger.info('User logged in', { userId: user.id, tenantId: user.tenantId })
    return { user }
  }

  async register(data: { email: string; password: string; tenantId: string; name?: string }) {
    // Check if user already exists
    const existing = await this.db.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      throw new Error('User already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await this.db.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name || data.email.split('@')[0],
        tenantId: data.tenantId,
      },
    })

    logger.info('User registered', { userId: user.id, tenantId: user.tenantId })
    return user
  }

  async getUserById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { tenant: true },
    })
  }
}
