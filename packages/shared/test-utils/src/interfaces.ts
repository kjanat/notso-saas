import type { Job } from 'bullmq'

export interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  flush(): Promise<void>
}

export interface IQueueService {
  addJob<T>(queue: string, name: string, data: T, options?: unknown): Promise<string>
  removeJob(jobId: string): Promise<void>
  getJob(jobId: string): Promise<Job | null>
  getJobs(): Promise<Job[]>
  registerWorker<T>(queue: string, processor: (job: Job) => Promise<T>): void
}

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  debug(message: string, meta?: Record<string, unknown>): void
}
