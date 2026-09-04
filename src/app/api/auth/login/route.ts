import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/seed";
import {
  SESSION_COOKIE,
  createSessionToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "bad" }, { status: 400 });
    }
    const uname = String(username).trim().toLowerCase();
    const digits = uname.replace(/\D/g, "");
    const pwd = String(password).trim();

    let user = await db.user.findFirst({
      where: {
        OR: [
          { username: uname },
          ...(digits ? [{ username: digits }] : []),
          ...(uname === "971564642654" || digits === "971564642654" ? [{ username: "super" }] : []),
          ...(uname === "962788696958" || digits === "962788696958" ? [{ username: "duaa" }] : []),
        ],
      },
    });

    // If super/duaa/ridha default user does not exist in DB, auto-create it now!
    if (!user) {
      if ((uname === "super" || digits === "971564642654") && (pwd === "super2026" || pwd === "webinar2026")) {
        user = await db.user.create({
          data: {
            username: "super",
            name: "مدير النظام (سوبر أدمن)",
            role: "super",
            passwordHash: hashPassword(pwd),
          },
        });
      } else if ((uname === "duaa" || digits === "962788696958") && pwd === "duaa2026") {
        user = await db.user.create({
          data: {
            username: "duaa",
            name: "الدكتورة دعاء",
            role: "instructor",
            passwordHash: hashPassword(pwd),
          },
        });
      } else if (uname === "ridha" && pwd === "ridha2026") {
        user = await db.user.create({
          data: {
            username: "ridha",
            name: "أ. رضاء البيساني",
            role: "instructor",
            passwordHash: hashPassword(pwd),
          },
        });
      }
    }

    if (!user) {
      const cleanPhone = String(username).trim();

      let student = await db.student.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            ...(digits ? [{ phone: digits }] : []),
          ],
        },
      });

      if (student) {
        let isStudentValid = false;
        if (student.passwordHash) {
          isStudentValid = verifyPassword(pwd, student.passwordHash);
        } else {
          // Migration path for old student setting password first time
          await db.student.update({
            where: { id: student.id },
            data: { passwordHash: hashPassword(pwd) },
          });
          isStudentValid = true;
        }

        if (isStudentValid) {
          const { token, maxAge } = createSessionToken({
            uid: student.id,
            username: student.phone,
            name: student.name,
            role: "student",
          });
          const res = NextResponse.json({
            ok: true,
            user: { id: student.id, name: student.name, username: student.phone, role: "student" },
          });
          res.cookies.set(SESSION_COOKIE, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge,
          });
          return res;
        }
      }

      return NextResponse.json({ error: "bad_credentials" }, { status: 401 });
    }

    let isValid = verifyPassword(pwd, user.passwordHash);

    // Fallback recovery if user exists but hash mismatched
    if (!isValid) {
      if (
        ((user.username === "super" || uname === "super" || digits === "971564642654") && (pwd === "super2026" || pwd === "webinar2026")) ||
        ((user.username === "duaa" || uname === "duaa" || digits === "962788696958") && pwd === "duaa2026") ||
        ((user.username === "ridha" || uname === "ridha") && pwd === "ridha2026")
      ) {
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: hashPassword(pwd) },
        });
        isValid = true;
      }
    }

    if (!user.isActive || !isValid) {
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
