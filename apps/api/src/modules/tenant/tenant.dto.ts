import { z } from 'zod'

export const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(3)
    .max(50),
  email: z.string().email(),
})

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  settings: z.record(z.any()).optional(),
})

export type CreateTenantDto = z.infer<typeof createTenantSchema>
export type UpdateTenantDto = z.infer<typeof updateTenantSchema>
