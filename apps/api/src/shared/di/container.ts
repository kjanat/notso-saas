import 'reflect-metadata'
import { container } from 'tsyringe'
import type { DependencyContainer } from 'tsyringe'

// Import interfaces
import type { ICacheService, IQueueService, ILogger } from '../interfaces/base.interfaces.js'

// Import implementations
import { CacheService } from '../cache/index.js'
import { QueueService } from '../queue/index.js'
import { logger } from '../utils/logger.js'

// AI Factory
import { AIProviderFactory } from '../../modules/ai/ai.factory.js'
import type { IAIProviderFactory } from '../../modules/ai/ai.interfaces.js'

export function setupContainer(): DependencyContainer {
  // Register shared services
  container.registerSingleton<ICacheService>('ICacheService', CacheService as any)
  container.registerSingleton<IQueueService>('IQueueService', QueueService as any)
  container.registerInstance<ILogger>('ILogger', logger)

  // Register AI Factory
  container.registerSingleton<IAIProviderFactory>('IAIProviderFactory', AIProviderFactory)

  return container
}

export { container }
