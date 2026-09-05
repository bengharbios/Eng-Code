import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { makeSlug } from "@/lib/auth";
import type { EditQuestion } from "@/lib/scoring";

import { ensureSeed } from "@/lib/seed";

// GET /api/tests — session: own (instructor) / all (super) | ?public=1: published gallery
export async function GET(req: NextRequest) {
  try {
    try { await ensureSeed(); } catch (e) { console.error("ensureSeed error in GET /api/tests:", e); }
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
          title: t.title || "اختبار",
          description: t.description || "",
          emoji: t.emoji || "📝",
          color: t.color || "#7c3aed",
          kind: t.kind || "points",
          language: t.language || "ar",
          levelTag: t.levelTag || "general",
          timeLimitMin: t.timeLimitMin || 0,
          isSystem: Boolean(t.isSystem),
          logoUrl: t.logoUrl || "",
          institutionName: t.institutionName || "",
          khdaFee: t.khdaFee ?? 140,
          certTitleAr: t.certTitleAr || "",
          certTitleEn: t.certTitleEn || "",
          courseHours: t.courseHours ?? 30,
          disableCertPreview: Boolean(t.disableCertPreview),
          showSponsorOnCert: t.showSponsorOnCert !== false,
          questionCount: t._count?.questions || 0,
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
        logoUrl: t.logoUrl || "",
        institutionName: t.institutionName || "",
        allowCertificate: t.allowCertificate,
        certificateType: t.certificateType,
        allowKhdaAttestation: t.allowKhdaAttestation,
        khdaFee: t.khdaFee,
        certTitleAr: t.certTitleAr || "",
        certTitleEn: t.certTitleEn || "",
        courseHours: t.courseHours ?? 30,
        disableCertPreview: Boolean(t.disableCertPreview),
        showSponsorOnCert: t.showSponsorOnCert !== false,
        ownerName: t.owner?.name || "المعهد",
        questionCount: t._count?.questions || 0,
        attemptsCount: t._count?.attempts || 0,
        createdAt: t.createdAt,
      }))
    );
  } catch (err: any) {
    console.error("GET /api/tests error:", err);
    return NextResponse.json({ error: "server", message: err?.message || String(err) }, { status: 500 });
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
      logoUrl = "",
      institutionName = "",
      allowCertificate = true,
      certificateType = "level",
      allowKhdaAttestation = true,
      khdaFee = 140,
      certTitleAr = "",
      certTitleEn = "",
      courseHours = 30,
      disableCertPreview = false,
      showSponsorOnCert = true,
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
        logoUrl: String(logoUrl).slice(0, 500000),
        institutionName: String(institutionName).slice(0, 300),
        allowCertificate: Boolean(allowCertificate),
        certificateType: certificateType === "attendance" ? "attendance" : "level",
        allowKhdaAttestation: Boolean(allowKhdaAttestation),
        khdaFee: Math.max(0, Number(khdaFee) || 140),
        certTitleAr: String(certTitleAr || "").slice(0, 200),
        certTitleEn: String(certTitleEn || "").slice(0, 200),
        courseHours: Math.max(1, Number(courseHours) || 30),
        disableCertPreview: Boolean(disableCertPreview),
        showSponsorOnCert: Boolean(showSponsorOnCert),
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
