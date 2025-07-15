import { PrismaClient } from '@saas/database'

let prisma: PrismaClient

export function getTestDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_TEST_URL ||
            process.env.DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5432/saas_platform_test',
        },
      },
      log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return prisma
}

export async function cleanDatabase() {
  const prisma = getTestDatabase()

  // Get all table names except migrations
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables 
    WHERE schemaname='public' 
    AND tablename != '_prisma_migrations'
    ORDER BY tablename
  `

  // Disable foreign key checks temporarily
  await prisma.$executeRawUnsafe('SET session_replication_role = replica;')

  // Truncate all tables
  for (const { tablename } of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`)
    } catch (error) {
      console.warn(`Could not truncate ${tablename}:`, error)
    }
  }

  // Re-enable foreign key checks
  await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;')
}

export async function resetSequences() {
  const prisma = getTestDatabase()

  // Reset all sequences to 1
  const sequences = await prisma.$queryRaw<Array<{ sequence_name: string }>>`
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  `

  for (const { sequence_name } of sequences) {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${sequence_name}" RESTART WITH 1`)
  }
}

export async function setupTestDatabase() {
  await cleanDatabase()
  await resetSequences()
}

export async function teardownTestDatabase() {
  const prisma = getTestDatabase()
  await prisma.$disconnect()
}
