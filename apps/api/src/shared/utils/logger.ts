import pino from 'pino'
import { config } from '../../config/index.js'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    config.env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
})
