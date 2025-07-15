import { Prisma, PrismaClient } from '@saas/database'
import { PrismaClient, Prisma } from '@saas/database'

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


export async function resetSequences(): Promise<void> {
  const prisma = getTestDatabase()
  const errors: Array<{ sequence: string; error: unknown }> = []

  try {
    // Reset all sequences to 1 using parameterized query
    const sequences = await prisma.$queryRaw<Array<{ sequence_name: string }>>`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = ${'public'}
    `

    for (const { sequence_name } of sequences) {
      try {
        // Validate sequence name to prevent SQL injection
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sequence_name)) {
          throw new Error(`Invalid sequence name: ${sequence_name}`)
        }
        await prisma.$executeRaw`ALTER SEQUENCE ${Prisma.raw(`"${sequence_name}"`)} RESTART WITH 1`
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

export async function setupTestDatabase(): Promise<void> {
  await cleanDatabase()
  await resetSequences()
}

export async function teardownTestDatabase(): Promise<void> {
  const prisma = getTestDatabase()
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Failed to disconnect from test database:', error)
    // Re-throw to ensure test failures are noticed
    throw new Error(`Database disconnect failed: ${error}`)
  }
}
// Replace the cleanDatabase function with an optimized version
export async function cleanDatabase() {
  const prisma = getTestDatabase()
  const errors = []

  try {
    // Get all table names except migrations in a single query
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
      ORDER BY tablename
    `

    // Use a transaction for atomic cleanup
    await prisma.$transaction(async (tx) => {
      // Disable foreign key checks for faster cleanup
      await tx.$executeRaw`SET session_replication_role = replica`
      
      // Batch truncate operations
      const truncatePromises = tables.map(({ tablename }) => {
        // Validate table name to prevent SQL injection
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tablename)) {
          errors.push({ error: new Error(`Invalid table name: ${tablename}`), table: tablename })
          return Promise.resolve()
        }
        
        return tx.$executeRaw`TRUNCATE TABLE ${Prisma.raw(`"${tablename}"`)} CASCADE`
          .catch(error => {
            errors.push({ error, table: tablename })
            console.warn(`Failed to truncate table '${tablename}':`, error)
          })
      })
      
      await Promise.allSettled(truncatePromises)
      
      // Re-enable foreign key checks
      await tx.$executeRaw`SET session_replication_role = DEFAULT`
    })

  } catch (error) {
    throw new Error(`Database cleanup transaction failed: ${error}`)
  }

  // Report errors but don't fail the cleanup unless all tables failed
  if (errors.length > 0) {
    const errorMessage = `Failed to truncate ${errors.length} table(s):\n` +
      errors.map(({ table, error }) => `  - ${table}: ${error}`).join('\n')
    
    if (errors.length === tables?.length) {
      throw new Error(errorMessage)
    } else {
      console.warn(errorMessage)
    }
  }
}
