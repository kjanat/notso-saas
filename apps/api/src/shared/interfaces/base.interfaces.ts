export interface IBaseRepository<T, CreateDTO = any, UpdateDTO = any> {
  create(data: CreateDTO): Promise<T>
  findById(id: string): Promise<T | null>
  findAll(filters?: Record<string, any>): Promise<T[]>
  count(filters?: Record<string, any>): Promise<number>
  update(id: string, data: UpdateDTO): Promise<T>
  delete(id: string): Promise<void>
}

export interface IBaseService<T, CreateDTO = any, UpdateDTO = any> {
  create(data: CreateDTO): Promise<T>
  findById(id: string): Promise<T>
  findAll(filters?: Record<string, any>): Promise<T[]>
  update(id: string, data: UpdateDTO): Promise<T>
  delete(id: string): Promise<void>
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

export interface IQueueService {
  addJob<T>(queue: string, name: string, data: T): Promise<void>
  process<T, R>(queue: string, name: string, handler: (data: T) => Promise<R>): void
}

export interface ILogger {
  info(message: string, meta?: any): void
  error(message: string, error?: Error, meta?: any): void
  warn(message: string, meta?: any): void
  debug(message: string, meta?: any): void
}
