import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "missing_phone" }, { status: 400 });
    }

    const student = await db.student.findUnique({
      where: { phone: phone.trim() },
    });

    if (!student) {
      return NextResponse.json({ status: "not_found" });
    }

    if (student.passwordHash) {
      return NextResponse.json({ status: "exists_with_password", name: student.name });
    }

    return NextResponse.json({ status: "exists_no_password", name: student.name });
  } catch (err) {
    console.error("POST /api/student/check-phone:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
