import bcrypt from 'bcryptjs'

import { getDatabase } from '../../shared/database/index.js'
import { logger } from '../../shared/utils/logger.js'

export class AuthService {
  private get db() {
    return getDatabase()
  }

  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({
      include: { tenant: true },
      where: { email },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null
    }

    logger.info('User logged in', { tenantId: user.tenantId, userId: user.id })
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
        name: data.name || data.email.split('@')[0],
        passwordHash,
        tenantId: data.tenantId,
      },
    })

    logger.info('User registered', {
      tenantId: user.tenantId,
      userId: user.id,
    })
    return user
  }

  async getUserById(id: string) {
    return this.db.user.findUnique({
      include: { tenant: true },
      where: { id },
    })
  }
}
