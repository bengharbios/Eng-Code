import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient;

const tUrl = process.env.TURSO_DATABASE_URL || "libsql://database-yellow-button-vercel-icfg-16naipzg5tbpfaiz1ny2dv98.aws-us-east-1.turso.io";
const tAuth = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3ODg1MzAyOTAsImlhdCI6MTc4ODQ0Mzg5MCwiaWQiOiIwMWEwNjc1Yy04YTAxLTc5MTMtYjUxNi1iMTQ5OTI4ZDBiOTciLCJraWQiOiJ6TWY4dk0tcUl6aWxFNlczYTUtWkUxNldWdkdSNE9LUGdGVUc5X3Z6elE0IiwicmlkIjoiMGY5NDE5OGQtNTU2OS00MDYwLTkyOWQtZTAyOTdjODk0OTVhIn0.bwxfZSKpmBtK9zgjq1j4Kw4kjiWkDOXdHGGK3kYVJFQk93s2fCBRpAw8VlrM1a4d5r70tzs5LfO5SzuaMR5_DA";

if (tUrl && tUrl !== "undefined" && tAuth && tAuth !== "undefined") {
  try {
    const libsql = createClient({
      url: tUrl.replace(/"/g, '').trim(),
      authToken: tAuth.replace(/"/g, '').trim(),
    })
    const adapter = new PrismaLibSQL(libsql)
    prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ['query'] })
  } catch (e) {
    console.error("Libsql init error:", e);
    prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
  }
} else {
  prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
}

export const db = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db