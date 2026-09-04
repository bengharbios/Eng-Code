import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient;

const tUrl = process.env.TURSO_DATABASE_URL || "libsql://englishcode-radiant-pisces-nw.aws-us-east-1.turso.io";
const tAuth = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1MzIzODAsImlkIjoiMDFhMDY3N2YtMjcwMS03MWFmLWI1NjctNDQyOTVlYzhjNDk0Iiwia2lkIjoiQjFIRm0wcnBPelNsMDR1eHZFaG51bmdRLWQyb0ZUeXJsdGU3bllUNm43VSIsInJpZCI6ImZlNjI5OGY0LTUxMDAtNDhiZi04ZTlhLWQwNGI1ZDZhMjIwMyJ9.tIrl9nlic_9zHPjJ4Usu7McWcyViK16vHS5v6MyramIZ8GxZESF7YrKAdKSVsBtTVGvX7CpHvkhzYXUWTptgAA";

export let lastInitError: any = null;

if (tUrl && tUrl !== "undefined" && tAuth && tAuth !== "undefined") {
  try {
    // Vercel's cached adapter version exports PrismaLibSQL (capitalized)
    // BUT it takes a Config object instead of a Client instance.
    const adapter = new PrismaLibSQL({
      url: tUrl.replace(/"/g, '').trim(),
      authToken: tAuth.replace(/"/g, '').trim(),
    } as any)
    
    // Prisma Engine reads DATABASE_URL from process.env because of schema.prisma.
    process.env.DATABASE_URL = tUrl.replace(/"/g, '').trim();
    
    prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ['query'] })
  } catch (e) {
    console.error("Libsql init error:", e);
    lastInitError = String(e) + " | stack: " + (e as any).stack;
    prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
  }
} else {
  prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
}

export const db = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db