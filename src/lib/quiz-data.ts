// ===== CEFR English Placement Test — Kid-Friendly =====
// Inspired by best practices from open-source projects:
// github.com/topics/kids-learning (CEFR-based kids English apps)
// github.com/topics/quiz-app (gamified quiz engines)

export type QuestionType = "picture" | "grammar" | "vocab" | "reading";
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export interface Question {
  id: number;
  level: CEFRLevel;
  type: QuestionType;
  emoji?: string; // for picture type
  passage?: string; // for reading type
  question: string; // English question text
  options: string[];
  answer: number; // correct option index
}

export const POINTS_PER_QUESTION = 5;

export const QUESTIONS: Question[] = [
  // ===== A1 — Beginner =====
  {
    id: 1,
    level: "A1",
    type: "picture",
    emoji: "🐱",
    question: "What is this?",
    options: ["a dog", "a cat", "a bird", "a fish"],
    answer: 1,
  },
  {
    id: 2,
    level: "A1",
    type: "grammar",
    question: "I ___ a student.",
    options: ["is", "are", "am", "be"],
    answer: 2,
  },
  {
    id: 3,
    level: "A1",
    type: "picture",
    emoji: "☀️",
    question: "What is in the sky?",
    options: ["The moon", "A cloud", "The sun", "A star"],
    answer: 2,
  },
  {
    id: 4,
    level: "A1",
    type: "vocab",
    question: "What color is a banana? 🍌",
    options: ["Yellow", "Red", "Blue", "Black"],
    answer: 0,
  },

  // ===== A2 — Elementary =====
  {
    id: 5,
    level: "A2",
    type: "grammar",
    question: "They ___ to school every morning.",
    options: ["goes", "go", "going", "gone"],
    answer: 1,
  },
  {
    id: 6,
    level: "A2",
    type: "picture",
    emoji: "🌧️",
    question: "How is the weather?",
    options: ["It's sunny", "It's snowy", "It's rainy", "It's windy"],
    answer: 2,
  },
  {
    id: 7,
    level: "A2",
    type: "grammar",
    question: "Yesterday, I ___ football with my friends.",
    options: ["play", "plays", "played", "playing"],
    answer: 2,
  },
  {
    id: 8,
    level: "A2",
    type: "vocab",
    question: "What is the opposite of 'big'?",
    options: ["Tall", "Long", "Fast", "Small"],
    answer: 3,
  },

  // ===== B1 — Intermediate =====
  {
    id: 9,
    level: "B1",
    type: "grammar",
    question: "If it rains tomorrow, we ___ stay at home.",
    options: ["will", "would", "are", "did"],
    answer: 0,
  },
  {
    id: 10,
    level: "B1",
    type: "grammar",
    question: "I have lived in this city ___ 2019.",
    options: ["for", "since", "at", "from"],
    answer: 1,
  },
  {
    id: 11,
    level: "B1",
    type: "vocab",
    question: "'Delicious' means...",
    options: ["very tasty", "very bad", "very cold", "very loud"],
    answer: 0,
  },
  {
    id: 12,
    level: "B1",
    type: "reading",
    passage:
      "Anna is a doctor. She works in a big hospital. Every morning, she wakes up at six o'clock and drinks a cup of coffee before going to work. On weekends, she loves reading books and walking in the park.",
    question: "What does Anna do before going to work?",
    options: [
      "She reads books",
      "She walks in the park",
      "She drinks coffee",
      "She cooks breakfast",
    ],
    answer: 2,
  },

  // ===== B2 — Upper-Intermediate =====
  {
    id: 13,
    level: "B2",
    type: "grammar",
    question: "By next year, she ___ her master's degree.",
    options: [
      "completes",
      "will complete",
      "will have completed",
      "completed",
    ],
    answer: 2,
  },
  {
    id: 14,
    level: "B2",
    type: "vocab",
    question: "'Reluctant' means...",
    options: [
      "very excited",
      "unwilling and hesitant",
      "extremely tired",
      "completely sure",
    ],
    answer: 1,
  },
  {
    id: 15,
    level: "B2",
    type: "grammar",
    question: "The report ___ by the manager yesterday.",
    options: ["was reviewed", "reviewed", "is reviewing", "has reviewed"],
    answer: 0,
  },
  {
    id: 16,
    level: "B2",
    type: "reading",
    passage:
      "Despite the team's best efforts, the project was postponed due to circumstances beyond their control. However, the manager remained optimistic that things would improve soon.",
    question: "What happened to the project?",
    options: [
      "It was cancelled forever",
      "It was delayed",
      "It was finished early",
      "It was never started",
    ],
    answer: 1,
  },

  // ===== C1 — Advanced =====
  {
    id: 17,
    level: "C1",
    type: "vocab",
    question: "'Ubiquitous' means...",
    options: [
      "present everywhere",
      "extremely rare",
      "very expensive",
      "highly dangerous",
    ],
    answer: 0,
  },
  {
    id: 18,
    level: "C1",
    type: "grammar",
    question: "Not until she arrived ___ the meeting begin.",
    options: ["had", "was", "does", "did"],
    answer: 3,
  },
  {
    id: 19,
    level: "C1",
    type: "vocab",
    question: "'To bite the bullet' means...",
    options: [
      "to eat very quickly",
      "to face a difficult situation bravely",
      "to speak angrily",
      "to make a serious mistake",
    ],
    answer: 1,
  },
  {
    id: 20,
    level: "C1",
    type: "grammar",
    question: "Had I known about the traffic, I ___ a different route.",
    options: ["will take", "took", "would have taken", "had taken"],
    answer: 2,
  },
];

// ===== Level definitions =====
export interface LevelInfo {
  code: CEFRLevel;
  nameAr: string;
  nameEn: string;
  emoji: string;
  color: string; // tailwind-ish hex
  bg: string;
  description: string;
  minPercent: number;
}

export const LEVELS: LevelInfo[] = [
  {
    code: "A1",
    nameAr: "مبتدئ",
    nameEn: "Beginner",
    emoji: "🌱",
    color: "#22c55e",
    bg: "#dcfce7",
    description:
      "أنت في بداية رحلتك مع اللغة الإنجليزية! سنتعلم معاً الحروف، الكلمات الأساسية، وجمل التعريف بالذات والأشياء اليومية. لا تقلق، الطريق أمامك ممتع وواضح!",
    minPercent: 0,
  },
  {
    code: "A2",
    nameAr: "مبتدئ متقدم",
    nameEn: "Elementary",
    emoji: "🌿",
    color: "#14b8a6",
    bg: "#ccfbf1",
    description:
      "لديك أساس جيد في اللغة! سنساعدك على التحدث عن روتينك اليومي، وصف الأشياء والمشاعر، وإجراء محادثات بسيطة في المطاعم والأسواق والسفر.",
    minPercent: 35,
  },
  {
    code: "B1",
    nameAr: "متوسط",
    nameEn: "Intermediate",
    emoji: "🌳",
    color: "#f59e0b",
    bg: "#fef3c7",
    description:
      "مستوى رائع! تستطيع فهم النقاط الرئيسية في المواضيع المألوفة. سنعمل معاً على الطلاقة، التعبير عن الآراء، ومواضيع أعمق مثل العمل والدراسة والثقافة.",
    minPercent: 55,
  },
  {
    code: "B2",
    nameAr: "فوق المتوسط",
    nameEn: "Upper-Intermediate",
    emoji: "🏔️",
    color: "#f97316",
    bg: "#ffedd5",
    description:
      "مستوى متقدم فعلاً! تتفاعل بطلاقة مع المتحدثين الأصليين. سنصقل مهاراتك في النقاشات المعقدة، الكتابة الأكاديمية والمهنية، وفهم النصوص الطويلة.",
    minPercent: 70,
  },
  {
    code: "C1",
    nameAr: "متقدم",
    nameEn: "Advanced",
    emoji: "🚀",
    color: "#8b5cf6",
    bg: "#ede9fe",
    description:
      "مذهل! لغتك قريبة جداً من المتحدث الأصلي. سنأخذك إلى مستوى الاحتراف: الإقناع والخطابة، الكتابة الأكاديمية الدقيقة، وفهم كل ما تسمعه وتقرأه بسهولة.",
    minPercent: 85,
  },
];

export function getLevelByPercent(percent: number): LevelInfo {
  let result = LEVELS[0];
  for (const lvl of LEVELS) {
    if (percent >= lvl.minPercent) result = lvl;
  }
  return result;
}

export function getStarsByPercent(percent: number): number {
  if (percent >= 85) return 5;
  if (percent >= 70) return 4;
  if (percent >= 55) return 3;
  if (percent >= 35) return 2;
  return 1;
}

export const TYPE_LABELS: Record<QuestionType, { ar: string; emoji: string }> = {
  picture: { ar: "صور وكلمات", emoji: "🖼️" },
  grammar: { ar: "قواعد", emoji: "✏️" },
  vocab: { ar: "مفردات", emoji: "💡" },
  reading: { ar: "قراءة", emoji: "📖" },
};

export const ENCOURAGEMENTS = [
  "أنت بطل! 🌟",
  "رائع جداً! 🎉",
  "استمر يا بطل! 💪",
  "أحسنت! ⭐",
  "أداء مذهل! 🚀",
  "فكر جيداً، أنت قادر! 🧠",
  "بقيت خطوات قليلة! 🏁",
];
