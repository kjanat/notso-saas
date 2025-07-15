import { vi } from 'vitest'

import type {
  ICacheService,
  ILogger,
  IQueueService,
} from '../../../apps/api/src/shared/interfaces/base.interfaces'

// Import Job type from the same location as the interfaces
import type { Job } from 'bullmq'

// Mock Logger
export const createMockLogger = (): ILogger => ({
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
})

// Mock Cache Service
export const createMockCacheService = (): ICacheService => ({
  delete: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn().mockResolvedValue(false),
  flush: vi.fn().mockResolvedValue(undefined),
})

// Mock Queue Service
export const createMockQueueService = (): IQueueService => ({
  addJob: vi.fn().mockResolvedValue('mock-job-id'),
  getJob: vi.fn().mockResolvedValue(null),
  getJobs: vi.fn().mockResolvedValue([]),
  registerWorker: vi.fn(),
  removeJob: vi.fn().mockResolvedValue(undefined),
})

// Mock Job
export const createMockJob = <T = any>(data: T): Job<T> =>
  ({
    data,
    id: 'mock-job-id',
    name: 'mock-job',
    opts: {},
    progress: vi.fn(),
    update: vi.fn(),
  }) as Job<T>

// Mock Socket
export function createMockSocket() {
  const events = new Map<string, ((...args: any[]) => void)[]>()

  return {
    disconnect: vi.fn(),
    emit: vi.fn(),
    id: 'mock-socket-id',
    join: vi.fn(),
    leave: vi.fn(),
    off: vi.fn((event: string, handler: (...args: any[]) => void) => {
      const handlers = events.get(event) || []
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    }),
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!events.has(event)) events.set(event, [])
      events.get(event)!.push(handler)
    }),
    rooms: new Set<string>(),
  }
}

// Improved type safety for job operations
export function createTypedMockQueue<T = any>(): IQueueService {
  const jobs: Array<Job<T>> = []

  return {
    addJob: vi.fn(async <TData>(queue: string, name: string, data: TData, options?: unknown) => {
      const job = {
        data,
        id: `job-${Date.now()}-${Math.random()}`,
        name,
        queueName: queue,
        timestamp: Date.now(),
      } as Job<TData>
      jobs.push(job as Job<T>)
      return job.id
    }),
    getJob: vi.fn(async (jobId: string) => {
      return jobs.find(j => j.id === jobId) || null
    }),
    getJobs: vi.fn(async () => [...jobs]),
    registerWorker: vi.fn(),
    removeJob: vi.fn(async (jobId: string): Promise<void> => {
      const index = jobs.findIndex(j => j.id === jobId)
      if (index > -1) {
        jobs.splice(index, 1)
      }
    }),
  }
}
