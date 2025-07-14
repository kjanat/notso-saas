import 'reflect-metadata'
import type { DependencyContainer } from 'tsyringe'
import { container } from 'tsyringe'
import { AIProviderFactory } from '../../modules/ai/ai.factory.js'
import type { IAIProviderFactory } from '../../modules/ai/ai.interfaces.js'
import { CacheService } from '../cache/index.js'
import type { IAuditService } from '../interfaces/audit.interfaces.js'
import type { ICacheService, ILogger, IQueueService } from '../interfaces/base.interfaces.js'
import { QueueService } from '../queue/index.js'
import { AuditService } from '../services/audit.service.js'
import { logger } from '../utils/logger.js'

export function setupContainer(): DependencyContainer {
  // Register shared services
  container.registerSingleton<ICacheService>('ICacheService', CacheService)
  container.registerSingleton<IQueueService>('IQueueService', QueueService)
  container.registerSingleton<IAuditService>('IAuditService', AuditService)
  container.registerInstance<ILogger>('ILogger', logger)

  // Register AI Factory
  container.registerSingleton<IAIProviderFactory>('IAIProviderFactory', AIProviderFactory)

  return container
}

export { container }
