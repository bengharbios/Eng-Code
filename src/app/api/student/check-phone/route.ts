import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "missing_phone" }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // 1. Check if phone corresponds to a staff user (User table)
    let staffUser = await db.user.findFirst({
      where: {
        OR: [
          { username: cleanPhone },
          { username: cleanPhone === "962788696958" ? "duaa" : cleanPhone === "971564642654" ? "super" : cleanPhone },
        ],
      },
    });

    if (staffUser) {
      return NextResponse.json({
        status: "exists_with_password",
        name: staffUser.name,
        isStaff: true,
      });
    }

    // 2. Check Student table
    const rows = await db.$queryRawUnsafe<Array<{id: string; name: string; passwordHash: string | null}>>(
      `SELECT id, name, passwordHash FROM "Student" WHERE phone = ? LIMIT 1`,
      cleanPhone
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
