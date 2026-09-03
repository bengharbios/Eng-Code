import { LEVELS } from "@/lib/quiz-data";

export interface EditOption {
  text: string;
  bucket?: string;
}

export interface EditQuestion {
  id?: string;
  type: string; // 'choice' | 'picture' | 'reading'
  text: string;
  passage?: string;
  emoji?: string;
  options: EditOption[];
  answerIndex: number;
  points: number;
}

export interface Outcome {
  key: string;
  emoji: string;
  title: string;
  description: string;
  program: string;
  color: string;
}

export interface OutcomesDoc {
  buckets: Outcome[];
  tie: Outcome;
}

export interface ResultLevel {
  code: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  program?: string;
}

// ===== Points mode =====
export function computeLevel(test: { levelTag: string }, pct: number): ResultLevel {
  if (test.levelTag === "CEFR") {
    let lvl = LEVELS[0];
    for (const l of LEVELS) if (pct >= l.minPercent) lvl = l;
    return {
      code: lvl.code,
      name: `${lvl.nameAr} (${lvl.nameEn})`,
      description: lvl.description,
      emoji: lvl.emoji,
      color: lvl.color,
    };
  }
  if (pct >= 85)
    return {
      code: "EXC",
      name: "ممتاز / Excellent",
      description: "أداء رائع! أتقنت هذا الاختبار بامتياز.",
      emoji: "🏆",
      color: "#f59e0b",
    };
  if (pct >= 70)
    return {
      code: "VGOOD",
      name: "جيد جداً / Very Good",
      description: "نتيجة قوية! خطوة صغيرة تفصلك عن الإتقان الكامل.",
      emoji: "🌟",
      color: "#14b8a6",
    };
  if (pct >= 55)
    return {
      code: "GOOD",
      name: "جيد / Good",
      description: "أساس جيد! بقليل من المراجعة ستتقدم كثيراً.",
      emoji: "👍",
      color: "#f97316",
    };
  return {
    code: "REVIEW",
    name: "يحتاج مراجعة / Needs Review",
    description: "لا بأس أبداً! كل بطل بدأ من هنا — نراجع معاً وننجح.",
    emoji: "🌱",
    color: "#8b5cf6",
  };
}

export function computeStars(pct: number): number {
  if (pct >= 85) return 5;
  if (pct >= 70) return 4;
  if (pct >= 55) return 3;
  if (pct >= 35) return 2;
  return 1;
}

export function parseOutcomes(json: string): OutcomesDoc | null {
  try {
    const doc = JSON.parse(json);
    if (!doc || !Array.isArray(doc.buckets)) return null;
    return doc as OutcomesDoc;
  } catch {
    return null;
  }
}
