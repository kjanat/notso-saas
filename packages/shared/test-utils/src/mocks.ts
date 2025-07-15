import type { Job } from 'bullmq'
import { vi } from 'vitest'
import type {
  ICacheService,
  ILogger,
  IQueueService,
} from '../../../apps/api/src/shared/interfaces/base.interfaces'

export function createMockLogger(): ILogger {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }
}

export function createMockCache(): ICacheService {
  const cache = new Map<string, unknown>()

  return {
    delete: vi.fn(async (key: string) => {
      cache.delete(key)
    }),
    exists: vi.fn(async (key: string) => cache.has(key)),
    flush: vi.fn(async () => {
      cache.clear()
    }),
    get: vi.fn(async <T>(key: string) => cache.get(key) as T | null),
    set: vi.fn(async <T>(key: string, value: T) => {
      cache.set(key, value)
    }),
  }
}

export function createMockQueue(): IQueueService {
  const jobs: Partial<Job>[] = []

  return {
    addJob: vi.fn(async <T>(_queue: string, name: string, data: T) => {
      const job: Partial<Job> = {
        data,
        id: Date.now().toString(),
        name,
        queueName: _queue,
      }
      jobs.push(job)
      return job.id as string
    }),
    getJob: vi.fn(async (jobId: string) => {
      return jobs.find(j => j.id === jobId) as Job | null
    }),
    getJobs: vi.fn(async () => jobs as Job[]),
    registerWorker: vi.fn(),
    removeJob: vi.fn(async (jobId: string) => {
      const index = jobs.findIndex(j => j.id === jobId)
      if (index > -1) jobs.splice(index, 1)
    }),
  }
}

export function createMockRepository<T>(methods: string[]) {
  const repo: Record<string, ReturnType<typeof vi.fn>> = {}

  methods.forEach(method => {
    repo[method] = vi.fn()
  })

  return repo as T
}

// Common test setup helpers
export function setupMockEnvironment() {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret'
  process.env.LOG_LEVEL = 'error'
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test'
  process.env.REDIS_URL = 'redis://localhost:6379/1'
}

// Mock AI service responses
export function createMockAIResponse(content: string) {
  return {
    content,
    finishReason: 'stop',
    model: 'gpt-4-turbo-preview',
    usage: {
      completionTokens: 50,
      promptTokens: 100,
      totalTokens: 150,
    },
  }
}

// Mock WebSocket connection
export function createMockSocket() {
  const events = new Map<string, Function[]>()

  return {
    disconnect: vi.fn(),
    emit: vi.fn(),
    id: 'mock-socket-id',
    join: vi.fn(),
    leave: vi.fn(),
    off: vi.fn((event: string, handler: Function) => {
      const handlers = events.get(event) || []
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    }),
    on: vi.fn((event: string, handler: Function) => {
      if (!events.has(event)) events.set(event, [])
      events.get(event)!.push(handler)
    }),
    rooms: new Set<string>(),
  }
}
