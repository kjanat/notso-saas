import { PrismaClient } from '@prisma/client'
import { hashPassword, generateSalt } from '@saas/utils'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create platform admin user
  const adminSalt = generateSalt()
  const adminPassword = hashPassword('admin123', adminSalt)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@saas-platform.com' },
    update: {},
    create: {
      email: 'admin@saas-platform.com',
      passwordHash: adminPassword,
      name: 'Platform Admin',
      emailVerified: true,
      isActive: true,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          inApp: true,
          conversationAlerts: true,
          systemAlerts: true,
          marketingEmails: false
        },
        theme: 'system'
      }
    }
  })

  console.log('✅ Created platform admin:', admin.email)

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      slug: 'demo-company',
      name: 'Demo Company',
      databaseName: 'tenant_demo_company_a1b2c3d4',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'PROFESSIONAL',
      settings: {
        branding: {
          primaryColor: '#0066cc'
        },
        security: {
          allowedDomains: ['demo-company.com', 'localhost:3000']
        },
        features: {
          enableLegacyImport: true,
          enable3DAvatars: true,
          enableAnalytics: true,
          enableWebhooks: true
        }
      }
    }
  })

  console.log('✅ Created demo tenant:', demoTenant.name)

  // Create demo user for the tenant
  const demoUserSalt = generateSalt()
  const demoUserPassword = hashPassword('demo123', demoUserSalt)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@demo-company.com' },
    update: {},
    create: {
      email: 'demo@demo-company.com',
      passwordHash: demoUserPassword,
      name: 'Demo User',
      emailVerified: true,
      isActive: true,
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          inApp: true,
          conversationAlerts: true,
          systemAlerts: true,
          marketingEmails: true
        },
        theme: 'light'
      }
    }
  })

  // Link demo user to demo tenant
  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: demoUser.id
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: demoUser.id,
      role: 'TENANT_ADMIN',
      permissions: [
        { resource: 'chatbot', action: 'manage', scope: 'all' },
        { resource: 'conversation', action: 'manage', scope: 'all' },
        { resource: 'user', action: 'manage', scope: 'team' },
        { resource: 'analytics', action: 'read', scope: 'all' },
        { resource: 'billing', action: 'manage', scope: 'all' },
        { resource: 'settings', action: 'manage', scope: 'all' },
        { resource: 'api_key', action: 'manage', scope: 'all' }
      ]
    }
  })

  console.log('✅ Created demo user and linked to tenant:', demoUser.email)

  // Create initial API key for demo tenant
  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Default API Key',
      keyHash: 'demo_api_key_hash', // In production, this would be properly hashed
      permissions: [
        { resource: 'chatbot', action: 'read', scope: 'all' },
        { resource: 'conversation', action: 'create', scope: 'all' },
        { resource: 'conversation', action: 'read', scope: 'all' }
      ],
      createdBy: demoUser.id,
      isActive: true
    }
  })

  console.log('✅ Created demo API key')

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })