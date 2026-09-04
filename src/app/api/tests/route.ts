import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { makeSlug } from "@/lib/auth";
import type { EditQuestion } from "@/lib/scoring";

import { ensureSeed } from "@/lib/seed";

// GET /api/tests — session: own (instructor) / all (super) | ?public=1: published gallery
export async function GET(req: NextRequest) {
  try {
    await ensureSeed();
    const url = new URL(req.url);
    if (url.searchParams.get("public") === "1") {
      const tests = await db.test.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "asc" },
        include: {
          owner: { select: { name: true } },
          _count: { select: { questions: true } },
        },
      });
      return NextResponse.json(
        tests.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          description: t.description,
          emoji: t.emoji,
          color: t.color,
          kind: t.kind,
          language: t.language,
          levelTag: t.levelTag,
          timeLimitMin: t.timeLimitMin,
          isSystem: t.isSystem,
          ownerName: t.owner?.name || "المعهد",
          questionCount: t._count.questions,
        }))
      );
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const where = session.role === "super" ? {} : { ownerId: session.uid };
    const tests = await db.test.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });
    return NextResponse.json(
      tests.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        emoji: t.emoji,
        color: t.color,
        kind: t.kind,
        language: t.language,
        isSystem: t.isSystem,
        isPublished: t.isPublished,
        ownerName: t.owner.name,
        questionCount: t._count.questions,
        attemptsCount: t._count.attempts,
        createdAt: t.createdAt,
      }))
    );
  } catch (err) {
    console.error("GET /api/tests:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

// POST /api/tests — create test (instructor or super)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      title,
      description = "",
      language = "ar",
      kind = "points",
      emoji = "📝",
      color = "#7c3aed",
      levelTag = "general",
      passPercent = 50,
      timeLimitMin = 0,
      allowRetake = true,
      accreditation = "",
      outcomes = null,
      questions = [],
    } = body ?? {};

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "title_required" }, { status: 400 });
    }
    const qs: EditQuestion[] = Array.isArray(questions) ? questions : [];
    if (qs.length === 0) {
      return NextResponse.json({ error: "need_question" }, { status: 400 });
    }

    let slug = makeSlug();
    for (let i = 0; i < 5; i++) {
      const exists = await db.test.findUnique({ where: { slug } });
      if (!exists) break;
      slug = makeSlug();
    }

    const test = await db.test.create({
      data: {
        slug,
        title: String(title).trim().slice(0, 200),
        description: String(description).slice(0, 2000),
        language,
        kind: kind === "diagnostic" ? "diagnostic" : "points",
        emoji: String(emoji || "📝").slice(0, 8),
        color: String(color || "#7c3aed").slice(0, 20),
        levelTag: levelTag === "CEFR" ? "CEFR" : "general",
        passPercent: Math.min(100, Math.max(0, Number(passPercent) || 50)),
        timeLimitMin: Math.max(0, Math.min(180, Number(timeLimitMin) || 0)),
        allowRetake: Boolean(allowRetake),
        accreditation: String(accreditation).slice(0, 3000),
        outcomesJson: outcomes ? JSON.stringify(outcomes) : "",
        ownerId: (body.ownerId && session.role === "super") ? String(body.ownerId) : session.uid,
        questions: {
          create: qs.map((q, i) => ({
            order: i,
            type: ["choice", "picture", "reading"].includes(q.type) ? q.type : "choice",
            text: String(q.text || "").slice(0, 2000),
            passage: String(q.passage || "").slice(0, 4000),
            emoji: String(q.emoji || "").slice(0, 8),
            optionsJson: JSON.stringify(
              (q.options || []).map((o) => ({ text: String(o.text || ""), bucket: o.bucket }))
            ),
            answerIndex: Math.max(0, Number(q.answerIndex) || 0),
            points: Math.max(1, Math.min(100, Number(q.points) || 5)),
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, id: test.id, slug: test.slug });
  } catch (err) {
    console.error("POST /api/tests:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
