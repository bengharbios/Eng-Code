import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/export?testId=<id|all> — session required; xlsx file of students results
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const testId = url.searchParams.get("testId") || "all";

    const where: Record<string, unknown> = {};
    if (testId !== "all") {
      if (session.role !== "super") {
        const test = await db.test.findUnique({ where: { id: testId } });
        if (!test || test.ownerId !== session.uid) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
      }
      where.testId = testId;
    } else if (session.role !== "super") {
      where.test = { ownerId: session.uid };
    }

    const attempts = await db.attempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: true,
        test: { select: { title: true, emoji: true } },
      },
    });

    const rows = attempts.map((a) => ({
      "الاسم": a.student.name,
      "الهاتف": a.student.phone,
      "العمر": a.student.age,
      "الدولة": a.student.country,
      "الاختبار": a.test.title,
      "الدرجة": `${a.score}/${a.total}`,
      "النسبة %": a.percentage,
      "المستوى": a.levelName,
      "البرنامج المقترح": a.program || "—",
      "طلب مقابلة Zoom": a.wantsInterview ? "نعم" : "لا",
      "تاريخ المحاولة": new Date(a.createdAt).toLocaleString("ar"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "الاسم": "لا توجد بيانات" }]);
    ws["!cols"] = [
      { wch: 24 }, { wch: 18 }, { wch: 8 }, { wch: 16 }, { wch: 34 },
      { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 40 }, { wch: 16 }, { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نتائج الطلبة");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `students-results-${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/export:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
