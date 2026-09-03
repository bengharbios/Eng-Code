import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

// PATCH /api/instructors/[id] — super only: toggle active / reset password / rename
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.name !== undefined) data.name = String(body.name).trim().slice(0, 120);
    if (body.password !== undefined) {
      if (String(body.password).length < 5) {
        return NextResponse.json({ error: "weak" }, { status: 400 });
      }
      data.passwordHash = hashPassword(String(body.password));
    }
    await db.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/instructors/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

// DELETE /api/instructors/[id] — super only (cannot delete super accounts or self)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (id === session.uid) {
      return NextResponse.json({ error: "self" }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (user.role === "super") {
      return NextResponse.json({ error: "locked" }, { status: 403 });
    }
    // Delete their tests first (attempts/questions cascade)
    await db.test.deleteMany({ where: { ownerId: id } });
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/instructors/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
