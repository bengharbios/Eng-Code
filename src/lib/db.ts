import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient;

const HARDCODED_TURSO_URL = "libsql://database-yellow-button-vercel-icfg-16naipzg5tbpfaiz1ny2dv98.aws-us-east-1.turso.io";
const HARDCODED_TURSO_AUTH = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NDA1MTMsImlkIjoiMDFhMDY3NWMtOGEwMS03OTEzLWI1MTYtYjE0OTkyOGQwYjk3Iiwia2lkIjoiek1mOHZNLXFJemlsRTZXM2E1LVpFMTZXVnZHUjRPS1BnRlVHOV92enpRNCIsInJpZCI6IjBmOTQxOThkLTU1NjktNDA2MC05MjlkLWUwMjk3Yzg5NDk1YSJ9.cfoumPoafheR4R_r9TzlfhC6vB2Haspff-_K4aLxT3llCCjkdA7AH_KX7dq9biyw1OZS0ZFrE1O1vDKtMTvMBA";

let tUrl = HARDCODED_TURSO_URL;
let tAuth = HARDCODED_TURSO_AUTH;

export let lastInitError: any = null;

if (tUrl && tAuth) {
  try {
    const adapter = new PrismaLibSQL({
      url: tUrl.replace(/"/g, '').trim(),
      authToken: tAuth.replace(/"/g, '').trim(),
    } as any);
    
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