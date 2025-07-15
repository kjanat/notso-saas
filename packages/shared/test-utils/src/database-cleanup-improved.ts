import { Prisma } from '@saas/database'
import { getTestDatabase } from './database'

export async function cleanDatabase(): Promise<void> {
  const prisma = getTestDatabase()
  
  // Use parameterized queries for security
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename != '_prisma_migrations'
    ORDER BY tablename
  `
  
  // Use DELETE instead of TRUNCATE for better performance in tests
  for (const { tablename } of tables) {
    try {
      await prisma.$executeRaw`DELETE FROM ${Prisma.raw(`"${tablename}"`)} WHERE 1=1`
    } catch (error) {
      console.warn(`Failed to clean table ${tablename}:`, error)
    }
  }
}