import type { Tenant, TenantUser, User } from '@saas/database'

export interface AuthUser extends User {
  tenants: Array<TenantUser & { tenant: Tenant }>
}

export interface AuthResponse {
  user: AuthUser & { tenantId: string }
}

export interface LoginResponse extends AuthResponse {
  availableTenants?: Array<{
    id: string
    name: string
    slug: string
  }>
}

export interface RegisterResponse {
  id: string
  email: string
  name: string
  tenantId: string
  tenants: TenantUser[]
  avatarUrl: string | null
  isActive: boolean
  emailVerified: boolean
  lastLoginAt: Date | null
  preferences: unknown
  metadata: unknown
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile extends User {
  tenantId?: string
  tenants: Array<TenantUser & { tenant: Tenant }>
}

export interface LoginOptions {
  email: string
  password: string
  tenantId?: string // Optional tenant selection during login
}

export interface RegisterOptions {
  email: string
  password: string
  tenantId: string
  name?: string
}
