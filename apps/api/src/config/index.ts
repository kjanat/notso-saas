import { z } from 'zod'

const configSchema = z.object({
  ai: z.object({
    anthropic: z.object({
      apiKey: z.string().optional(),
    }),
    openai: z.object({
      apiKey: z.string().optional(),
    }),
    voyage: z.object({
      apiKey: z.string().optional(),
    }),
  }),
  api: z.object({
    port: z.number().default(3000),
    url: z.string().default('http://localhost:3000'),
  }),
  cors: z.object({
    origins: z.array(z.string()).default(['http://localhost:3000']),
  }),
  database: z.object({
    url: z.string(),
  }),
  env: z.enum(['development', 'test', 'production']).default('development'),
  jwt: z.object({
    expiresIn: z.string().default('7d'),
    secret: z.string(),
  }),
  redis: z.object({
    url: z.string(),
  }),
  storage: z.object({
    local: z.object({
      uploadDir: z.string().default('./uploads'),
    }),
    s3: z.object({
      bucket: z.string().optional(),
      region: z.string().optional(),
    }),
    type: z.enum(['local', 's3']).default('local'),
  }),
})

export const config = configSchema.parse({
  ai: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    voyage: {
      apiKey: process.env.VOYAGE_API_KEY,
    },
  },
  api: {
    port: Number(process.env.PORT) || 3000,
    url: process.env.API_URL,
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(','),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  env: process.env.NODE_ENV,
  jwt: {
    expiresIn: process.env.JWT_EXPIRES_IN,
    secret: process.env.JWT_SECRET,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  storage: {
    local: {
      uploadDir: process.env.UPLOAD_DIR,
    },
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
    },
    type: process.env.STORAGE_TYPE as 'local' | 's3',
  },
})

export type Config = typeof config
