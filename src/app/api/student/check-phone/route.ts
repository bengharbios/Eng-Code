import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "missing_phone" }, { status: 400 });
    }

    // Use raw query to avoid Prisma failing on missing columns
    const rows = await db.$queryRawUnsafe<Array<{id: string; name: string; passwordHash: string | null}>>(
      `SELECT id, name, passwordHash FROM "Student" WHERE phone = ? LIMIT 1`,
      phone.trim()
    );

    const student = rows[0];

    if (!student) {
      return NextResponse.json({ status: "not_found" });
    }

    if (student.passwordHash) {
      return NextResponse.json({ status: "exists_with_password", name: student.name });
    }

    return NextResponse.json({ status: "exists_no_password", name: student.name });
  } catch (err) {
    console.error("POST /api/student/check-phone:", err);
    return NextResponse.json({ error: "server", detail: String(err) }, { status: 500 });
  }
}
