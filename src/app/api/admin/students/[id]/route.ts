import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

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

// PATCH /api/admin/students/[id] — reset password or change role (promote student to instructor/super)
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
    const body = await req.json().catch(() => ({}));

    // Reset password
    if (body.action === "resetPassword") {
      await db.$executeRawUnsafe(
        `UPDATE "Student" SET passwordHash = NULL WHERE id = ?`,
        id
      );
      return NextResponse.json({ ok: true });
    }

    // Role promotion / change
    if (body.role) {
      const student = await db.student.findUnique({ where: { id } });
      if (student) {
        if (body.role === "instructor" || body.role === "super") {
          const passHash = student.passwordHash || hashPassword("salem2026");
          await db.user.upsert({
            where: { username: student.phone },
            update: { role: body.role, name: student.name, isActive: true },
            create: {
              id: "user_" + student.id,
              username: student.phone,
              name: student.name,
              role: body.role,
              passwordHash: passHash,
              isActive: true,
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/admin/students/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
