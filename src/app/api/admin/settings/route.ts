import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Default site settings
const DEFAULTS: Record<string, string> = {
  siteName: "مغامرة المستوى",
  instituteName: "معهد السلام التثقافي",
  contactPhone: "042899688",
  welcomeMessage: "",
  footerText: "",
  heroTitle: "",
  heroSubtitle: "",
};

async function ensureSiteSettingsTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SiteSettings" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" TEXT NOT NULL DEFAULT '',
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch {}
}

// GET /api/admin/settings — public read (homepage needs it)
export async function GET() {
  try {
    await ensureSiteSettingsTable();
    const rows = await db.$queryRawUnsafe<Array<{ key: string; value: string }>>(
      `SELECT key, value FROM "SiteSettings"`
    );
    const settings = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
  } catch (err) {
    // Table might not exist yet — return defaults
    return NextResponse.json(DEFAULTS);
  }
}

// POST /api/admin/settings — super admin only
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    await ensureSiteSettingsTable();

    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== "string") continue;
      await db.$executeRawUnsafe(
        `INSERT INTO "SiteSettings" (key, value, updatedAt)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP`,
        key,
        value
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/settings:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
