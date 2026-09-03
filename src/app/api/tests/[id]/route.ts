import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { EditQuestion, OutcomesDoc } from "@/lib/scoring";

async function getTestWithAccess(id: string) {
  const session = await getSession();
  if (!session) return { error: "unauthorized" as const };
  const test = await db.test.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      questions: { orderBy: { order: "asc" } },
      _count: { select: { attempts: true } },
    },
  });
  if (!test) return { error: "not_found" as const };
  const isSuper = session.role === "super";
  const isOwner = test.ownerId === session.uid;
  if (!isSuper && !isOwner) return { error: "forbidden" as const };
  return { session, test, isSuper, isOwner };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await getTestWithAccess(id);
    if ("error" in res) {
      const status =
        res.error === "unauthorized" ? 401 : res.error === "not_found" ? 404 : 403;
      return NextResponse.json({ error: res.error }, { status });
    }
    const { test } = res;
    return NextResponse.json({
      id: test.id,
      slug: test.slug,
      title: test.title,
      description: test.description,
      language: test.language,
      kind: test.kind,
      isSystem: test.isSystem,
      isPublished: test.isPublished,
      emoji: test.emoji,
      color: test.color,
      levelTag: test.levelTag,
      passPercent: test.passPercent,
      timeLimitMin: test.timeLimitMin,
      accreditation: test.accreditation,
      outcomes: test.outcomesJson ? JSON.parse(test.outcomesJson) : null,
      ownerName: test.owner.name,
      attemptsCount: test._count.attempts,
      questions: test.questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        passage: q.passage,
        emoji: q.emoji,
        options: JSON.parse(q.optionsJson),
        answerIndex: q.answerIndex,
        points: q.points,
      })),
    });
  } catch (err) {
    console.error("GET /api/tests/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await getTestWithAccess(id);
    if ("error" in res) {
      const status =
        res.error === "unauthorized" ? 401 : res.error === "not_found" ? 404 : 403;
      return NextResponse.json({ error: res.error }, { status });
    }
    const { session, test } = res;
    // System tests: only super admin can edit (locked)
    if (test.isSystem && session!.role !== "super") {
      return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = String(body.title).trim().slice(0, 200);
    if (body.description !== undefined)
      data.description = String(body.description).slice(0, 2000);
    if (body.language !== undefined) data.language = String(body.language).slice(0, 8);
    if (body.kind !== undefined)
      data.kind = body.kind === "diagnostic" ? "diagnostic" : "points";
    if (body.emoji !== undefined) data.emoji = String(body.emoji || "📝").slice(0, 8);
    if (body.color !== undefined) data.color = String(body.color).slice(0, 20);
    if (body.levelTag !== undefined)
      data.levelTag = body.levelTag === "CEFR" ? "CEFR" : "general";
    if (body.passPercent !== undefined)
      data.passPercent = Math.min(100, Math.max(0, Number(body.passPercent) || 50));
    if (body.timeLimitMin !== undefined)
      data.timeLimitMin = Math.max(0, Math.min(180, Number(body.timeLimitMin) || 0));
    if (body.accreditation !== undefined)
      data.accreditation = String(body.accreditation).slice(0, 3000);
    if (body.outcomes !== undefined)
      data.outcomesJson = body.outcomes ? JSON.stringify(body.outcomes) : "";
    if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished);

    await db.test.update({ where: { id }, data });

    // Replace questions if provided
    if (Array.isArray(body.questions) && body.questions.length > 0) {
      const qs: EditQuestion[] = body.questions;
      await db.question.deleteMany({ where: { testId: id } });
      await db.question.createMany({
        data: qs.map((q, i) => ({
          testId: id,
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
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/tests/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await getTestWithAccess(id);
    if ("error" in res) {
      const status =
        res.error === "unauthorized" ? 401 : res.error === "not_found" ? 404 : 403;
      return NextResponse.json({ error: res.error }, { status });
    }
    const { session, test } = res;
    if (test.isSystem) {
      return NextResponse.json({ error: "locked" }, { status: 403 });
    }
    if (session!.role !== "super" && test.ownerId !== session!.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    await db.test.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/tests/[id]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
