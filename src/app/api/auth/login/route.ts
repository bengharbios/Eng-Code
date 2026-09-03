import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/seed";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "bad" }, { status: 400 });
    }
    const user = await db.user.findUnique({
      where: { username: String(username).trim().toLowerCase() },
    });
    if (!user || !user.isActive || !verifyPassword(String(password), user.passwordHash)) {
      return NextResponse.json({ error: "bad_credentials" }, { status: 401 });
    }
    const { token, maxAge } = createSessionToken({
      uid: user.id,
      username: user.username,
      name: user.name,
      role: user.role as "super" | "instructor",
    });
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
    return res;
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
