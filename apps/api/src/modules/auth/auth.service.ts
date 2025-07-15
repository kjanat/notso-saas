import bcrypt from 'bcryptjs'

import { getDatabase } from '../../shared/database/index.js'
import { logger } from '../../shared/utils/logger.js'

export class AuthService {
  private get db() {
    return getDatabase()
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.db.user.findUnique({
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
      where: { email },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null
    }

    // For now, assume the user logs into their first tenant
    // In a real app, you'd let them select which tenant to log into
    const tenantUser = user.tenants[0]
    if (!tenantUser) {
      throw new Error('User is not associated with any tenant')
    }

    logger.info('User logged in', { tenantId: tenantUser.tenantId, userId: user.id })

    // Return user with tenantId attached for convenience
    return {
      user: {
        ...user,
        tenantId: tenantUser.tenantId,
      },
    }
  }

  async register(data: {
    email: string
    password: string
    tenantId: string
    name?: string
  }): Promise<any> {
    // Check if user already exists
    const existing = await this.db.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      throw new Error('User already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user and associate with tenant
    const user = await this.db.user.create({
      data: {
        email: data.email,
        name: data.name || data.email.split('@')[0],
        passwordHash,
        tenants: {
          create: {
            role: 'TENANT_USER',
            tenantId: data.tenantId,
          },
        },
      },
      include: {
        tenants: true,
      },
    })

    logger.info('User registered', {
      tenantId: data.tenantId,
      userId: user.id,
    })

    // Return user with tenantId attached for convenience
    return {
      ...user,
      tenantId: data.tenantId,
    }
  }

  async getUserById(id: string, tenantId?: string): Promise<any> {
    const user = await this.db.user.findUnique({
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
      where: { id },
    })

    if (!user) {
      return null
    }

    // If tenantId is provided, verify the user belongs to that tenant
    if (tenantId) {
      const tenantUser = user.tenants.find(tu => tu.tenantId === tenantId)
      if (!tenantUser) {
        return null
      }
      return {
        ...user,
        tenantId,
      }
    }

    // Otherwise return user with their first tenant
    const tenantUser = user.tenants[0]
    return tenantUser
      ? {
          ...user,
          tenantId: tenantUser.tenantId,
        }
      : user
  }
}
