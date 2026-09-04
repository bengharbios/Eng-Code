import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// PATCH /api/admin/permissions/[id] — update instructor permissions
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
    const body = await req.json();
    const permissionsJson = JSON.stringify(body);

    await db.$executeRawUnsafe(
      `UPDATE "User" SET permissionsJson = ? WHERE id = ?`,
      permissionsJson,
      id
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/admin/permissions/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
