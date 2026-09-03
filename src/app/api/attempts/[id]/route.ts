import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/attempts/[id] — get attempt details including test questions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    
    const attempt = await db.attempt.findUnique({
      where: { id },
      include: {
        student: { select: { name: true, phone: true, age: true, country: true } },
        test: {
          include: {
            questions: { orderBy: { order: "asc" } }
          }
        }
      }
    });

    if (!attempt) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Only super admin or test owner can view details
    if (session.role !== "super" && attempt.test.ownerId !== session.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: attempt.id,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      level: attempt.level,
      levelName: attempt.levelName,
      program: attempt.program,
      answersJson: attempt.answersJson,
      student: attempt.student,
      test: {
        id: attempt.test.id,
        title: attempt.test.title,
        kind: attempt.test.kind,
        questions: attempt.test.questions.map(q => ({
          id: q.id,
          text: q.text,
          passage: q.passage,
          type: q.type,
          optionsJson: q.optionsJson,
          answerIndex: q.answerIndex,
          points: q.points
        }))
      }
    });
  } catch (err) {
    console.error("GET /api/attempts/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
