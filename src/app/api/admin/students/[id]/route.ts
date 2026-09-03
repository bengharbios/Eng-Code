import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// DELETE /api/admin/students/[id] — delete student account
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await db.student.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/students/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

// PATCH /api/admin/students/[id] — reset password (clear it)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { id } = await params;
    // Clear passwordHash so student can set a new one on next login
    await db.$executeRawUnsafe(
      `UPDATE "Student" SET passwordHash = NULL WHERE id = ?`,
      id
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/admin/students/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
