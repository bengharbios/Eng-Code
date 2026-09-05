import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/seed";

// GET /api/take/[slug] — public test data for taking (no answers leaked)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureSeed();
    const { slug } = await params;
    const test = await db.test.findUnique({
      where: { slug },
      include: {
        owner: { select: { name: true } },
        questions: { orderBy: { order: "asc" } },
      },
    });
    if (!test || !test.isPublished) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
      id: test.id,
      slug: test.slug,
      title: test.title,
      description: test.description,
      language: test.language,
      kind: test.kind,
      emoji: test.emoji,
      color: test.color,
      timeLimitMin: test.timeLimitMin,
      allowRetake: test.allowRetake,
      accreditation: test.accreditation,
      logoUrl: test.logoUrl || "",
      institutionName: test.institutionName || "",
      ownerName: test.owner.name,
      allowCertificate: test.allowCertificate,
      certificateType: test.certificateType,
      allowKhdaAttestation: test.allowKhdaAttestation,
      khdaFee: test.khdaFee,
      certTitleAr: test.certTitleAr || "",
      certTitleEn: test.certTitleEn || "",
      courseHours: test.courseHours ?? 30,
      disableCertPreview: Boolean(test.disableCertPreview),
      showSponsorOnCert: test.showSponsorOnCert !== false,
      questions: test.questions.map((q) => ({
        id: q.id,
        order: q.order,
        type: q.type,
        text: q.text,
        passage: q.passage,
        emoji: q.emoji,
        options: (JSON.parse(q.optionsJson) as { text: string }[]).map((o) => o.text),
        points: q.points,
      })),
    });
  } catch (err) {
    console.error("GET /api/take/[slug]:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
