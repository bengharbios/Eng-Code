import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  computeLevel,
  computeStars,
  parseOutcomes,
  type Outcome,
} from "@/lib/scoring";

// POST /api/attempts — submit an attempt (public, server-side scoring)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, testSlug, testId, name, studentName, phone, studentPhone, age, country, answers } = body ?? {};
    
    const effectiveSlug = slug || testSlug;
    const effectiveName = name || studentName;
    const effectivePhone = phone || studentPhone;

    if ((!effectiveSlug && !testId) || !effectiveName || !effectivePhone || !Array.isArray(answers)) {
      return NextResponse.json({ error: "bad", detail: "Missing required fields" }, { status: 400 });
    }

    const test = await db.test.findFirst({
      where: {
        OR: [
          effectiveSlug ? { slug: String(effectiveSlug) } : undefined,
          testId ? { id: String(testId) } : undefined,
        ].filter(Boolean) as any,
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!test || !test.isPublished) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Upsert student by phone — only update non-auth fields to preserve passwordHash
    let student = await db.student.findUnique({ where: { phone: String(phone).trim() } });
    if (student) {
      // Update name/age/country only if they have real values (don't overwrite with empty)
      const updateData: Record<string, any> = {};
      if (name && String(name).trim()) updateData.name = String(name).trim().slice(0, 120);
      if (age && Number(age) > 0) updateData.age = Math.max(0, Math.min(99, Number(age) || 0));
      if (country && String(country).trim()) updateData.country = String(country || "").slice(0, 60);
      
      if (Object.keys(updateData).length > 0) {
        student = await db.student.update({
          where: { id: student.id },
          data: updateData,
        });
      }
    } else {
      student = await db.student.create({
        data: {
          name: String(name).trim().slice(0, 120),
          phone: String(phone).trim().slice(0, 30),
          age: Math.max(0, Math.min(99, Number(age) || 0)),
          country: String(country || "").slice(0, 60),
        },
      });
    }

    const selectedMap = new Map<string, number>();
    for (const a of answers) {
      if (a && a.questionId !== undefined) {
        selectedMap.set(String(a.questionId), Number(a.selected));
      }
    }

    let resultLevel;
    let score = 0;
    let total = 0;
    let percentage = 0;

    if (test.kind === "diagnostic") {
      // ===== Diagnostic: most chosen bucket wins =====
      const counts: Record<string, number> = {};
      for (const q of test.questions) {
        const opts = JSON.parse(q.optionsJson) as { text: string; bucket?: string }[];
        const sel = selectedMap.get(q.id);
        if (sel === undefined || !opts[sel]) continue;
        const bucket = opts[sel].bucket || "?";
        counts[bucket] = (counts[bucket] || 0) + 1;
      }
      const answered = Object.values(counts).reduce((a, b) => a + b, 0);
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const outcomes = parseOutcomes(test.outcomesJson);
      const topKey = entries[0]?.[0] ?? "";
      const isTie =
        entries.length > 1 && entries[0][1] === entries[1][1] ? true : entries.length === 0;
      const findOutcome = (key: string): Outcome | undefined =>
        outcomes?.buckets.find((b) => b.key === key);
      const outcome =
        (isTie ? outcomes?.tie : undefined) ??
        findOutcome(topKey) ??
        outcomes?.tie ??
        ({
          key: topKey,
          emoji: "🎯",
          title: `التصنيف ${topKey}`,
          description: "",
          program: "",
          color: "#7c3aed",
        } as Outcome);

      score = outcome.key === "TIE" ? Math.max(...Object.values(counts), 0) : counts[outcome.key] || 0;
      total = test.questions.length;
      percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      resultLevel = {
        code: outcome.key,
        name: outcome.title,
        description: outcome.description,
        emoji: outcome.emoji,
        color: outcome.color,
        program: outcome.program,
      };
      if (answered === 0) {
        score = 0;
        percentage = 0;
      }
    } else {
      // ===== Points mode =====
      for (const q of test.questions) {
        total += q.points;
        const sel = selectedMap.get(q.id);
        if (sel === q.answerIndex) score += q.points;
      }
      percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      resultLevel = computeLevel(test, percentage);
    }

    const attempt = await db.attempt.create({
      data: {
        studentId: student.id,
        testId: test.id,
        score,
        total,
        percentage,
        level: resultLevel.code,
        levelName: resultLevel.name,
        program: resultLevel.program ?? "",
        answersJson: JSON.stringify(answers).slice(0, 20000),
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      mode: test.kind,
      score,
      total,
      percentage,
      stars: computeStars(percentage),
      level: resultLevel,
    });
  } catch (err) {
    console.error("POST /api/attempts:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

// PATCH /api/attempts — student marks interview request (public, scoped)
export async function PATCH(req: NextRequest) {
  try {
    const { attemptId } = await req.json();
    if (!attemptId) return NextResponse.json({ error: "bad" }, { status: 400 });
    await db.attempt.update({
      where: { id: String(attemptId) },
      data: { wantsInterview: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/attempts:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

// GET /api/attempts
//  ?phone=...           → public self-lookup by phone
//  ?testId=...          → session required (owner or super)
//  (no params)          → super only: everything / instructor: own tests' attempts
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get("phone");
    const testId = url.searchParams.get("testId");

    // Public self-lookup
    if (phone) {
      const attempts = await db.attempt.findMany({
        where: { student: { phone: phone.trim() } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { test: { select: { title: true, emoji: true, kind: true } } },
      });
      return NextResponse.json(
        attempts.map((a) => ({
          id: a.id,
          testTitle: a.test.title,
          testEmoji: a.test.emoji,
          score: a.score,
          total: a.total,
          percentage: a.percentage,
          levelName: a.levelName,
          program: a.program,
          wantsInterview: a.wantsInterview,
          answersJson: a.answersJson,
          createdAt: a.createdAt,
        }))
      );
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const where: Record<string, unknown> = {};
    if (testId) {
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
        student: { select: { name: true, phone: true, age: true, country: true } },
        test: { select: { title: true, emoji: true, kind: true } },
      },
    });

    return NextResponse.json(
      attempts.map((a) => ({
        id: a.id,
        name: a.student.name,
        phone: a.student.phone,
        age: a.student.age,
        country: a.student.country,
        testTitle: a.test.title,
        testEmoji: a.test.emoji,
        testId: a.testId,
        score: a.score,
        total: a.total,
        percentage: a.percentage,
        level: a.level,
        levelName: a.levelName,
        program: a.program,
        wantsInterview: a.wantsInterview,
        answersJson: a.answersJson,
        createdAt: a.createdAt,
      }))
    );
  } catch (err) {
    console.error("GET /api/attempts:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

// DELETE /api/attempts — delete an attempt (instructor or super)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "bad" }, { status: 400 });

    const attempt = await db.attempt.findUnique({
      where: { id },
      include: { test: { select: { ownerId: true } } }
    });

    if (!attempt) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (session.role !== "super" && attempt.test.ownerId !== session.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await db.attempt.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/attempts:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
