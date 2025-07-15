import 'reflect-metadata'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { setupContainer } from '../../../apps/api/src/shared/di/container'

interface TestAppOptions {
  logger?: boolean
  modules?: Array<{
    module: any
    prefix: string
  }>
}

export async function createTestApp(options: TestAppOptions = {}): Promise<FastifyInstance> {
  // Setup DI container
  setupContainer()

  // Create Fastify instance
  const app = Fastify({
    logger: options.logger ?? false,
  })

  // Register modules if provided
  if (options.modules) {
    for (const { module, prefix } of options.modules) {
      await app.register(module, { prefix })
    }
  }

  await app.ready()
  return app
}

export async function closeTestApp(app: FastifyInstance) {
  await app.close()
}
