// Enhanced type definitions for test utilities
export interface TestDatabaseConfig {
  url: string
  schema?: string
  logging?: boolean
}

export interface CleanupOptions {
  preserveTables?: string[]
  resetSequences?: boolean
  batchSize?: number
}

export interface TestEnvironmentConfig {
  database: TestDatabaseConfig
  redis: {
    url: string
    db?: number
  }
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug'
    enabled: boolean
  }
}