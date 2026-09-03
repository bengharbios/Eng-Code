import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const student = await db.student.findUnique({
      where: { id: session.uid },
      include: {
        attempts: {
          orderBy: { createdAt: "desc" },
          include: {
            test: {
              select: {
                title: true,
                kind: true,
                emoji: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const totalAttempts = student.attempts.length;
    const passedAttempts = student.attempts.filter(a => a.percentage >= 50).length; // assuming pass is 50%
    const averageScore = totalAttempts > 0 
      ? student.attempts.reduce((acc, curr) => acc + curr.percentage, 0) / totalAttempts 
      : 0;

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        age: student.age,
        country: student.country,
      },
      stats: {
        totalAttempts,
        passedAttempts,
        averageScore: Math.round(averageScore),
      },
      attempts: student.attempts.map((a) => ({
        id: a.id,
        testId: a.testId,
        score: a.score,
        total: a.total,
        percentage: a.percentage,
        levelName: a.levelName,
        createdAt: a.createdAt,
        test: a.test,
      })),
    });
  } catch (err) {
    console.error("GET /api/student/dashboard:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
