import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const isDemoMode = !process.env['DATABASE_URL'] || process.env['ALLOW_DEMO'] === 'true'

// Only create Prisma client if DATABASE_URL is available
export const prisma = isDemoMode
  ? (null as unknown as PrismaClient) // Will be handled by demo routers
  : (globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }))

if (process.env.NODE_ENV !== 'production' && !isDemoMode) {
  globalForPrisma.prisma = prisma
}

export default prisma
