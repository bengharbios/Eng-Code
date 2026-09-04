import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient;

const DEFAULT_TURSO_URL = "libsql://database-yellow-button-vercel-icfg-16naipzg5tbpfaiz1ny2dv98.aws-us-east-1.turso.io";
const DEFAULT_TURSO_AUTH = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3ODkxMzc3MjIsImlhdCI6MTc4ODUzMjkyMiwiaWQiOiIwMWEwNjc1Yy04YTAxLTc5MTMtYjUxNi1iMTQ5OTI4ZDBiOTciLCJraWQiOiJ6TWY4dk0tcUl6aWxFNlczYTUtWkUxNldWdkdSNE9LUGdGVUc5X3Z6elE0IiwicmlkIjoiMGY5NDE5OGQtNTU2OS00MDYwLTkyOWQtZTAyOTdjODk0OTVhIn0.ypuClb6jnIgAh3E2b7LS2KoKNk6oIaGzkl8eT6LMchBLCE7etY0dqhJXhz3j-Hmm6oHGF229bFJjAcFItCqdCQ";

let tUrl = process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL;
let tAuth = process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_AUTH;

if (!tAuth || tAuth.includes("1788530290") || tAuth === "undefined") {
  tAuth = DEFAULT_TURSO_AUTH;
}
if (!tUrl || tUrl === "undefined") {
  tUrl = DEFAULT_TURSO_URL;
}

export let lastInitError: any = null;

if (tUrl && tUrl !== "undefined" && tAuth && tAuth !== "undefined") {
  try {
    // Vercel's cached adapter version exports PrismaLibSQL (capitalized)
    // BUT it takes a Config object instead of a Client instance.
    const adapter = new PrismaLibSQL({
      url: tUrl.replace(/"/g, '').trim(),
      authToken: tAuth.replace(/"/g, '').trim(),
    } as any)
    
    // Ensure process.env has the forced valid credentials for Prisma Engine
    process.env.TURSO_DATABASE_URL = tUrl;
    process.env.TURSO_AUTH_TOKEN = tAuth;
    process.env.DATABASE_URL = `${tUrl}?authToken=${tAuth}`;
    
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