import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient;

const tUrl = process.env.TURSO_DATABASE_URL;
const tAuth = process.env.TURSO_AUTH_TOKEN;

if (tUrl && tUrl !== "undefined" && tAuth && tAuth !== "undefined") {
  const libsql = createClient({
    url: tUrl,
    authToken: tAuth,
  })
  const adapter = new PrismaLibSQL(libsql)
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ['query'] })
} else {
  prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
}

export const db = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db