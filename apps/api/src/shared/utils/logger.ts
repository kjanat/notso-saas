import pino from 'pino'

import { config } from '../../config/index.js'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    config.env === 'development'
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
