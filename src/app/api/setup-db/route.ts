import { NextResponse } from "next/server";
import { db, lastInitError } from "@/lib/db";

export async function GET() {
  try {
    const sql = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'instructor',
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "Test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'ar',
    "kind" TEXT NOT NULL DEFAULT 'points',
    "isSystem" BOOLEAN NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT 1,
    "emoji" TEXT NOT NULL DEFAULT '📝',
    "color" TEXT NOT NULL DEFAULT '#7c3aed',
    "levelTag" TEXT NOT NULL DEFAULT 'general',
    "passPercent" INTEGER NOT NULL DEFAULT 50,
    "timeLimitMin" INTEGER NOT NULL DEFAULT 0,
    "accreditation" TEXT NOT NULL DEFAULT '',
    "outcomesJson" TEXT NOT NULL DEFAULT '',
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Test_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Test_slug_key" ON "Test"("slug");

CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'choice',
    "text" TEXT NOT NULL,
    "passage" TEXT NOT NULL DEFAULT '',
    "emoji" TEXT NOT NULL DEFAULT '',
    "optionsJson" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL DEFAULT 0,
    "bucket" TEXT NOT NULL DEFAULT '',
    "points" INTEGER NOT NULL DEFAULT 5,
    CONSTRAINT "Question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "age" INTEGER NOT NULL DEFAULT 0,
    "country" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Student_phone_key" ON "Student"("phone");

CREATE TABLE IF NOT EXISTS "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "percentage" REAL NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT '',
    "levelName" TEXT NOT NULL DEFAULT '',
    "program" TEXT NOT NULL DEFAULT '',
    "wantsInterview" BOOLEAN NOT NULL DEFAULT 0,
    "answersJson" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

    const statements = sql.split(";").filter((s) => s.trim().length > 0);
    for (const stmt of statements) {
      await db.$executeRawUnsafe(stmt + ";");
    }

    try { await db.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN "passwordHash" TEXT;`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Attempt" ADD COLUMN "answersJson" TEXT NOT NULL DEFAULT '';`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "permissionsJson" TEXT NOT NULL DEFAULT '{}';`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Test" ADD COLUMN "allowRetake" BOOLEAN NOT NULL DEFAULT 1;`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Test" ADD COLUMN "logoUrl" TEXT NOT NULL DEFAULT '';`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Test" ADD COLUMN "institutionName" TEXT NOT NULL DEFAULT '';`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Test" ADD COLUMN "allowCertificate" BOOLEAN NOT NULL DEFAULT 1;`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Test" ADD COLUMN "certificateType" TEXT NOT NULL DEFAULT 'level';`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Test" ADD COLUMN "allowKhdaAttestation" BOOLEAN NOT NULL DEFAULT 1;`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Test" ADD COLUMN "khdaFee" INTEGER NOT NULL DEFAULT 140;`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Attempt" ADD COLUMN "certRequested" BOOLEAN NOT NULL DEFAULT 0;`); } catch(e) {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "Attempt" ADD COLUMN "certDetailsJson" TEXT NOT NULL DEFAULT '';`); } catch(e) {}
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SiteSettings" (
          "key" TEXT NOT NULL PRIMARY KEY,
          "value" TEXT NOT NULL DEFAULT '',
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch(e) {}

    return NextResponse.json({ success: true, message: "Tables created successfully!" });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: String(err),
      debug: {
        tUrl: process.env.TURSO_DATABASE_URL || "MISSING",
        tUrlLen: process.env.TURSO_DATABASE_URL?.length || 0,
        tAuth: process.env.TURSO_AUTH_TOKEN ? "PRESENT" : "MISSING",
        initError: lastInitError,
      }
    }, { status: 500 });
  }
}
