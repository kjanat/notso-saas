import { z } from 'zod'

export const createTenantSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(3)
    .max(50),
})

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  settings: z.record(z.unknown()).optional(),
})

export type CreateTenantDto = z.infer<typeof createTenantSchema>
export type UpdateTenantDto = z.infer<typeof updateTenantSchema>

export interface TenantFilters {
  isActive?: boolean
  plan?: string
  name?: string
  slug?: string
}
