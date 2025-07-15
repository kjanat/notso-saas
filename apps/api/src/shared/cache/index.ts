import { Redis } from 'ioredis'

import { config } from '../../config/index.js'
import { logger } from '../utils/logger.js'

let redis: Redis

export async function setupCache() {
  redis = new Redis(config.redis.url, {
    enableReadyCheck: true,
    lazyConnect: false,
    maxRetriesPerRequest: 3,
  })

  redis.on('connect', () => {
    logger.info('Redis connected successfully')
  })

  redis.on('error', err => {
    logger.error('Redis error:', err)
  })

  // Test connection
  try {
    await redis.ping()
  } catch (error) {
    logger.error('Failed to connect to Redis:', error)
    throw error
  }
}

export function getCache() {
  if (!redis) {
    throw new Error('Cache not initialized. Call setupCache() first.')
  }
  return redis
}

export class CacheService {
  private redis: Redis

  constructor() {
    this.redis = getCache()
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    return value ? JSON.parse(value) : null
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttl) {
      await this.redis.setex(key, ttl, serialized)
    } else {
      await this.redis.set(key, serialized)
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key)
    return result === 1
  }

  async flush(force = false): Promise<void> {
    // Safeguard against accidental production data loss
    if (process.env.NODE_ENV === 'production' && !force) {
      throw new Error(
        'Cannot flush Redis database in production. Use force=true if you really want to do this.'
      )
    }

    // Additional safety check for production
    if (process.env.NODE_ENV === 'production' && force) {
      logger.warn('Flushing Redis database in production environment', {
        timestamp: new Date().toISOString(),
      })
    }

    await this.redis.flushdb()
  }
}
