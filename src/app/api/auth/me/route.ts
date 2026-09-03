import { NextResponse } from "next/server";
import { ensureSeed } from "@/lib/seed";
import { getSession } from "@/lib/auth";

export async function GET() {
  await ensureSeed();
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: session.uid,
      username: session.username,
      name: session.name,
      role: session.role,
    },
  });
}
