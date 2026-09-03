import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_PASSWORD } from "@/lib/config";

function isAuthorized(key: string | null): boolean {
  return key === ADMIN_PASSWORD;
}

// Register a new student (before the quiz)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, age, country } = body ?? {};

    if (!name || !phone || age === undefined || age === null || !country) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة: الاسم، الهاتف، العمر، الدولة" },
        { status: 400 }
      );
    }

    const parsedAge = parseInt(String(age), 10);
    if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 99) {
      return NextResponse.json(
        { error: "الرجاء إدخال عمر صحيح (5 - 99)" },
        { status: 400 }
      );
    }

    const student = await db.student.create({
      data: {
        name: String(name).trim().slice(0, 120),
        phone: String(phone).trim().slice(0, 30),
        age: parsedAge,
        country: String(country).trim().slice(0, 60),
      },
    });

    return NextResponse.json({ id: student.id });
  } catch (err) {
    console.error("POST /api/students error:", err);
    return NextResponse.json(
      { error: "حدث خطأ في الحفظ، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}

// Save quiz results / interview request
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      score,
      total,
      percentage,
      level,
      levelName,
      wantsInterview,
      answersJson,
    } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: "معرّف الطالب مطلوب" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (score !== undefined) data.score = Math.round(Number(score));
    if (total !== undefined) data.total = Math.round(Number(total));
    if (percentage !== undefined) data.percentage = Number(percentage);
    if (level !== undefined) data.level = String(level);
    if (levelName !== undefined) data.levelName = String(levelName);
    if (wantsInterview !== undefined)
      data.wantsInterview = Boolean(wantsInterview);
    if (answersJson !== undefined)
      data.answersJson = String(answersJson).slice(0, 20000);

    const student = await db.student.update({ where: { id }, data });
    return NextResponse.json({ ok: true, id: student.id });
  } catch (err) {
    console.error("PATCH /api/students error:", err);
    return NextResponse.json(
      { error: "حدث خطأ في تحديث النتيجة" },
      { status: 500 }
    );
  }
}

// Admin: list all students
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!isAuthorized(key)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const students = await db.student.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        age: true,
        country: true,
        score: true,
        total: true,
        percentage: true,
        level: true,
        levelName: true,
        wantsInterview: true,
        createdAt: true,
      },
    });

    return NextResponse.json(students);
  } catch (err) {
    console.error("GET /api/students error:", err);
    return NextResponse.json({ error: "خطأ في جلب البيانات" }, { status: 500 });
  }
}

// Admin: delete a student
export async function DELETE(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    const id = req.nextUrl.searchParams.get("id");
    if (!isAuthorized(key)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });
    }
    await db.student.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/students error:", err);
    return NextResponse.json({ error: "خطأ في الحذف" }, { status: 500 });
  }
}
