import { generateSalt, hashPassword } from '@saas/utils'
import { PrismaClient } from '../node_modules/.prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create platform admin user
  const adminSalt = generateSalt()
  const adminPasswordPlain = process.env.ADMIN_PASSWORD || 'SecureAdm!n2025#Dev'
  const adminPassword = hashPassword(adminPasswordPlain, adminSalt)

  await prisma.user.upsert({
    create: {
      email: 'admin@saas-platform.com',
      emailVerified: true,
      isActive: true,
      name: 'Platform Admin',
      passwordHash: adminPassword,
      preferences: {
        language: 'en',
        notifications: {
          conversationAlerts: true,
          email: true,
          inApp: true,
          marketingEmails: false,
          systemAlerts: true,
        },
        theme: 'system',
        timezone: 'UTC',
      },
    },
    update: {},
    where: { email: 'admin@saas-platform.com' },
  })

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    create: {
      databaseName: 'tenant_demo_company_a1b2c3d4',
      name: 'Demo Company',
      settings: {
        branding: {
          primaryColor: '#0066cc',
        },
        features: {
          enable3DAvatars: true,
          enableAnalytics: true,
          enableLegacyImport: true,
          enableWebhooks: true,
        },
        security: {
          allowedDomains: ['demo-company.com', 'localhost:3000'],
        },
      },
      slug: 'demo-company',
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
    },
    update: {},
    where: { slug: 'demo-company' },
  })

  // Create demo user for the tenant
  const demoUserSalt = generateSalt()
  const demoPasswordPlain = process.env.DEMO_PASSWORD || 'DemoUser@2025!'
  const demoUserPassword = hashPassword(demoPasswordPlain, demoUserSalt)

  const demoUser = await prisma.user.upsert({
    create: {
      email: 'demo@demo-company.com',
      emailVerified: true,
      isActive: true,
      name: 'Demo User',
      passwordHash: demoUserPassword,
      preferences: {
        language: 'en',
        notifications: {
          conversationAlerts: true,
          email: true,
          inApp: true,
          marketingEmails: true,
          systemAlerts: true,
        },
        theme: 'light',
        timezone: 'America/New_York',
      },
    },
    update: {},
    where: { email: 'demo@demo-company.com' },
  })

  // Link demo user to demo tenant
  await prisma.tenantUser.upsert({
    create: {
      permissions: [
        { action: 'manage', resource: 'chatbot', scope: 'all' },
        { action: 'manage', resource: 'conversation', scope: 'all' },
        { action: 'manage', resource: 'user', scope: 'team' },
        { action: 'read', resource: 'analytics', scope: 'all' },
        { action: 'manage', resource: 'billing', scope: 'all' },
        { action: 'manage', resource: 'settings', scope: 'all' },
        { action: 'manage', resource: 'api_key', scope: 'all' },
      ],
      role: 'TENANT_ADMIN',
      tenantId: demoTenant.id,
      userId: demoUser.id,
    },
    update: {},
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: demoUser.id,
      },
    },
  })

  // Create initial API key for demo tenant
  await prisma.apiKey.create({
    data: {
      createdBy: demoUser.id,
      isActive: true,
      keyHash: 'demo_api_key_hash', // In production, this would be properly hashed
      name: 'Default API Key',
      permissions: [
        { action: 'read', resource: 'chatbot', scope: 'all' },
        { action: 'create', resource: 'conversation', scope: 'all' },
        { action: 'read', resource: 'conversation', scope: 'all' },
      ],
      tenantId: demoTenant.id,
    },
  })
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
