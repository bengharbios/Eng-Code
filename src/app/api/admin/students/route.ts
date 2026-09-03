import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/admin/students — super admin only
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const students = await db.$queryRawUnsafe<Array<{
      id: string;
      name: string;
      phone: string;
      age: number;
      country: string;
      passwordHash: string | null;
      createdAt: string;
      attemptsCount: number;
    }>>(
      `SELECT s.id, s.name, s.phone, s.age, s.country, s.passwordHash, s.createdAt,
              COUNT(a.id) as attemptsCount
       FROM "Student" s
       LEFT JOIN "Attempt" a ON a.studentId = s.id
       GROUP BY s.id
       ORDER BY s.createdAt DESC`
    );

    return NextResponse.json(
      students.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        age: s.age,
        country: s.country,
        hasPassword: !!s.passwordHash,
        createdAt: s.createdAt,
        attemptsCount: Number(s.attemptsCount),
      }))
    );
  } catch (err) {
    console.error("GET /api/admin/students:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
