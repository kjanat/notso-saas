import bcrypt from 'bcryptjs'

import { getDatabase } from '../../shared/database/index.js'
import { logger } from '../../shared/utils/logger.js'
import type {
  LoginOptions,
  LoginResponse,
  RegisterOptions,
  RegisterResponse,
  UserProfile,
} from './auth.types.js'

export class AuthService {
  private get db() {
    return getDatabase()
  }

  async login(options: LoginOptions): Promise<LoginResponse | null> {
    const { email, password, tenantId } = options

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

    // Handle tenant selection
    let selectedTenant

    if (tenantId) {
      // User specified a tenant, verify they have access
      selectedTenant = user.tenants.find(tu => tu.tenantId === tenantId)
      if (!selectedTenant) {
        throw new Error('User does not have access to the specified tenant')
      }
    } else if (user.tenants.length === 1) {
      // User has only one tenant, auto-select it
      selectedTenant = user.tenants[0]
    } else if (user.tenants.length > 1) {
      // User has multiple tenants but didn't specify one
      // Return available tenants for selection
      return {
        availableTenants: user.tenants.map(tu => ({
          id: tu.tenant.id,
          name: tu.tenant.name,
          slug: tu.tenant.slug,
        })),
        user: {
          ...user,
          tenantId: '', // No tenant selected yet
        },
      }
    } else {
      throw new Error('User is not associated with any tenant')
    }

    logger.info('User logged in', { tenantId: selectedTenant.tenantId, userId: user.id })

    // Return user with selected tenantId
    return {
      user: {
        ...user,
        tenantId: selectedTenant.tenantId,
      },
    }
  }

  async register(data: RegisterOptions): Promise<RegisterResponse> {
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

  async getUserById(id: string, tenantId?: string): Promise<UserProfile | null> {
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
