import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/take/[slug]/check?phone=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get("phone");
    if (!phone) {
      return NextResponse.json({ canTake: true }); // Can't check without phone
    }

    const { slug } = await params;
    const test = await db.test.findUnique({
      where: { slug },
      select: { id: true, allowRetake: true, isPublished: true }
    });

    if (!test || !test.isPublished) {
      return NextResponse.json({ canTake: false, error: "not_found" });
    }

    if (test.allowRetake) {
      return NextResponse.json({ canTake: true });
    }

    // Check if student exists and has an attempt
    const student = await db.student.findUnique({
      where: { phone: phone.trim() },
      select: { id: true }
    });

    if (!student) {
      return NextResponse.json({ canTake: true });
    }

    const existingAttempt = await db.attempt.findFirst({
      where: {
        studentId: student.id,
        testId: test.id
      }
    });

    if (existingAttempt) {
      return NextResponse.json({ canTake: false, error: "already_taken" });
    }

    return NextResponse.json({ canTake: true });
  } catch (err) {
    console.error("GET /api/take/[slug]/check:", err);
    return NextResponse.json({ canTake: true }); // Default to allow on server error so we don't block randomly
  }
}
