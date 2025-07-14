import { z } from 'zod'

const configSchema = z.object({
  env: z.enum(['development', 'test', 'production']).default('development'),
  api: z.object({
    port: z.number().default(3000),
    url: z.string().default('http://localhost:3000'),
  }),
  database: z.object({
    url: z.string(),
  }),
  redis: z.object({
    url: z.string(),
  }),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string().default('7d'),
  }),
  cors: z.object({
    origins: z.array(z.string()).default(['http://localhost:3000']),
  }),
  ai: z.object({
    openai: z.object({
      apiKey: z.string().optional(),
    }),
    anthropic: z.object({
      apiKey: z.string().optional(),
    }),
  }),
  storage: z.object({
    type: z.enum(['local', 's3']).default('local'),
    local: z.object({
      uploadDir: z.string().default('./uploads'),
    }),
    s3: z.object({
      bucket: z.string().optional(),
      region: z.string().optional(),
    }),
  }),
})

export const config = configSchema.parse({
  env: process.env.NODE_ENV,
  api: {
    port: Number(process.env.PORT) || 3000,
    url: process.env.API_URL,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(','),
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  },
  storage: {
    type: process.env.STORAGE_TYPE as 'local' | 's3',
    local: {
      uploadDir: process.env.UPLOAD_DIR,
    },
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
    },
  },
})

export type Config = typeof config
