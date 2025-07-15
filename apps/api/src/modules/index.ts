import type { FastifyInstance } from 'fastify'
import { aiModule } from './ai/ai.module.js'
import { analyticsModule } from './analytics/analytics.module.js'
import { authModule } from './auth/auth.module.js'
import { chatbotModule } from './chatbot/chatbot.module.js'
import { conversationModule } from './conversation/conversation.module.js'
import { healthModule } from './health/health.module.js'
import { tenantModule } from './tenant/tenant.module.js'

export async function registerModules(app: FastifyInstance) {
  // Register modules with their prefixes
  await app.register(healthModule, { prefix: '/health' })
  await app.register(authModule, { prefix: '/auth' })
  await app.register(tenantModule, { prefix: '/tenants' })
  await app.register(chatbotModule, { prefix: '/chatbots' })
  await app.register(conversationModule, { prefix: '/conversations' })
  await app.register(aiModule, { prefix: '/ai' })
  await app.register(analyticsModule, { prefix: '/analytics' })
}
