import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pino = require('pino')

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'HH:MM:ss Z',
          },
          target: 'pino-pretty',
        }
      : undefined,
})
