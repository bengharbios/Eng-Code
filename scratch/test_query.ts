import { db } from "../src/lib/db";

async function testQuery() {
  try {
    const count = await db.attempt.count();
    console.log("Total attempts count in DB:", count);
    const attempts = await db.attempt.findMany({
      take: 5,
      include: {
        student: { select: { name: true, phone: true } },
        test: { select: { title: true } },
      },
    });
    console.log("Sample attempts:", JSON.stringify(attempts, null, 2));
  } catch (e) {
    console.error("Query error:", e);
  }
}

testQuery();
