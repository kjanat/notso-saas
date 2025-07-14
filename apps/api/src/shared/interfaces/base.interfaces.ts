export interface IBaseRepository<
  T,
  CreateDTO = Record<string, unknown>,
  UpdateDTO = Partial<CreateDTO>,
> {
  create(data: CreateDTO): Promise<T>
  findById(id: string): Promise<T | null>
  findAll(filters?: Record<string, unknown>): Promise<T[]>
  count(filters?: Record<string, unknown>): Promise<number>
  update(id: string, data: UpdateDTO): Promise<T>
  delete(id: string): Promise<void>
}

export interface IBaseService<
  T,
  CreateDTO = Record<string, unknown>,
  UpdateDTO = Partial<CreateDTO>,
> {
  create(data: CreateDTO): Promise<T>
  findById(id: string): Promise<T>
  findAll(filters?: Record<string, unknown>): Promise<T[]>
  update(id: string, data: UpdateDTO): Promise<T>
  delete(id: string): Promise<void>
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

export interface IQueueService {
  addJob<T>(queue: string, name: string, data: T, options?: unknown): Promise<unknown>
  registerWorker<T>(queue: string, processor: (job: unknown) => Promise<T>): void
}

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  debug(message: string, meta?: Record<string, unknown>): void
}
