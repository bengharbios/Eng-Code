import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, password, age, country, mode } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // Check if staff user (User table)
    let staffUser = await db.user.findFirst({
      where: {
        OR: [
          { username: cleanPhone },
          { username: cleanPhone === "962788696958" ? "duaa" : cleanPhone === "971564642654" ? "super" : cleanPhone },
        ],
      },
    });

    if (staffUser) {
      if (!verifyPassword(password, staffUser.passwordHash)) {
        return NextResponse.json({ error: "invalid_password" }, { status: 401 });
      }
      const { token, maxAge } = createSessionToken({
        uid: staffUser.id,
        username: staffUser.username,
        name: staffUser.name,
        role: staffUser.role as any,
      });

      const res = NextResponse.json({
        success: true,
        student: { id: staffUser.id, name: staffUser.name, phone: cleanPhone, age: 0, country: "" },
      });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge,
        path: "/",
      });

      return res;
    }

    let student = await db.student.findUnique({ where: { phone: cleanPhone } });

    if (mode === "register") {
      if (student) {
        return NextResponse.json({ error: "already_exists" }, { status: 400 });
      }
      student = await db.student.create({
        data: {
          phone,
          name: name || "طالب جديد",
          passwordHash: hashPassword(password),
          age: parseInt(age) || 0,
          country: country || "",
        },
      });
    } else {
      if (!student) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      if (!student.passwordHash) {
        // Migration path for old students without password
        await db.student.update({
          where: { id: student.id },
          data: { passwordHash: hashPassword(password) },
        });
      } else if (!verifyPassword(password, student.passwordHash)) {
        return NextResponse.json({ error: "invalid_password" }, { status: 401 });
      }
    }

    const { token, maxAge } = createSessionToken({
      uid: student.id,
      username: student.phone,
      name: student.name,
      role: "student",
    });

    const res = NextResponse.json({ success: true, student });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("POST /api/student/auth:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
