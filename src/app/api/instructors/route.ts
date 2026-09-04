import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

// GET /api/instructors — super only
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const users = await db.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { tests: true } } },
    });
    return NextResponse.json(
      users.map((u: any) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        permissionsJson: u.permissionsJson || "",
        testsCount: u._count.tests,
        createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    console.error("GET /api/instructors:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

// POST /api/instructors — super only: create instructor
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { name, username, password } = await req.json();
    if (!name || !username || !password) {
      return NextResponse.json({ error: "bad" }, { status: 400 });
    }
    const uname = String(username).trim().toLowerCase().replace(/\s+/g, "");
    if (uname.length < 3 || String(password).length < 5) {
      return NextResponse.json({ error: "weak" }, { status: 400 });
    }
    const exists = await db.user.findUnique({ where: { username: uname } });
    if (exists) {
      return NextResponse.json({ error: "exists" }, { status: 409 });
    }
    const user = await db.user.create({
      data: {
        username: uname,
        name: String(name).trim().slice(0, 120),
        role: "instructor",
        passwordHash: hashPassword(String(password)),
      },
    });
    return NextResponse.json({ ok: true, id: user.id });
  } catch (err) {
    console.error("POST /api/instructors:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
