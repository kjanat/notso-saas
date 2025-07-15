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
  const errors: Array<{ table: string; error: unknown }> = []

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
      // Validate table name to prevent SQL injection
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tablename)) {
        throw new Error(`Invalid table name: ${tablename}`)
      }
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`)
    } catch (error) {
      errors.push({ error, table: tablename })
      console.warn(`Failed to truncate table '${tablename}':`, error)
    }
  }

  // Re-enable foreign key checks
  await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;')

  // If there were errors, throw a comprehensive error
  if (errors.length > 0) {
    const errorMessage =
      `Failed to truncate ${errors.length} table(s):\n` +
      errors.map(({ table, error }) => `  - ${table}: ${error}`).join('\n')
    throw new Error(errorMessage)
  }
}

export async function resetSequences() {
  const prisma = getTestDatabase()
  const errors: Array<{ sequence: string; error: unknown }> = []

  try {
    // Reset all sequences to 1
    const sequences = await prisma.$queryRaw<Array<{ sequence_name: string }>>`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `

    for (const { sequence_name } of sequences) {
      try {
        // Validate sequence name to prevent SQL injection
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sequence_name)) {
          throw new Error(`Invalid sequence name: ${sequence_name}`)
        }
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${sequence_name}" RESTART WITH 1`)
      } catch (error) {
        errors.push({ error, sequence: sequence_name })
        console.error(`Failed to reset sequence '${sequence_name}':`, error)
      }
    }

    // If some sequences failed, log warning but continue
    if (errors.length > 0) {
      console.warn(`Failed to reset ${errors.length} sequence(s), but continuing...`)
    }
  } catch (error) {
    throw new Error(`Failed to query sequences: ${error}`)
  }
}

export async function setupTestDatabase() {
  await cleanDatabase()
  await resetSequences()
}

export async function teardownTestDatabase() {
  const prisma = getTestDatabase()
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Failed to disconnect from test database:', error)
    // Re-throw to ensure test failures are noticed
    throw new Error(`Database disconnect failed: ${error}`)
  }
}
