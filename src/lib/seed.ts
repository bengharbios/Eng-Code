import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { QUESTIONS } from "@/lib/quiz-data";

// ===== Accreditation text (from الدليل التشخيصي والاعتماد العلمي) =====
export const ACCREDITATION_TEXT =
  "يستند هذا الاختبار إلى منهجيات علمية حديثة في تعليم اللغات:\n• معايير الإطار الأوروبي المرجعي للغات (CEFR): كأساس للأداء الوظيفي وتحديد المستويات الدقيقة من A1 إلى C1.\n• معيار الموقف النفسي (Language Attitude): لقياس تأثير حاجز الخوف من الخطأ (Affective Filter) على الطلاقة والإنتاج اللغوي.\n• معيار المعالجة الفعلية (Core Processing): للتفريق بين الترجمة الحرفية البطيئة والإنتاج اللغوي الفوري التلقائي.";

export const ACCREDITATION_FOOTER =
  "إعداد وتصميم: د. دعاء البيساني — مؤسسة قيادة التعلم المرح (LFL) | بالتعاون مع معهد السلام الثقافي";

// ===== Diagnostic test content (from the uploaded PDF) =====
const DIAGNOSTIC_QUESTIONS: {
  text: string;
  options: { text: string; bucket: string }[];
}[] = [
  {
    text: "عندما تستمع لمتحدث أجنبي يتحدث بسرعة طبيعية، ما الذي يحدث معك غالباً؟",
    options: [
      { text: "أفهم كلمات متفرقة وأحتاج أن يتحدث ببطء شديد", bucket: "A" },
      { text: "أفهم الفكرة العامة لكن أفتقد بعض التفاصيل الدقيقة", bucket: "B" },
      { text: "أفهم بنسبة كبيرة جداً وأستطيع ملاحقة التفاصيل السريعة", bucket: "C" },
    ],
  },
  {
    text: "عندما تريد التعبير عن فكرة بالإنجليزية، كيف تتصرف؟",
    options: [
      { text: "أقوم بترجمة الحديث في عقلي كلمة بكلمة وأتوقف كثيراً بسبب القواعد", bucket: "A" },
      { text: "أتحدث بثقة في المواقف اليومية، لكن أتوتر في التفاصيل العميقة أو بيئة العمل", bucket: "B" },
      { text: "أتكلم بطلاقة وتلقائية، ومشكلتي محصورة فقط في الصقل والمفردات المتقدمة", bucket: "C" },
    ],
  },
  {
    text: "عندما تشارك في اجتماع عمل أو تقرأ بريداً إلكترونياً رسمياً، كيف تشعر؟",
    options: [
      { text: "أتجنب قراءتها لأن الكلمات الرسمية صعبة ومركبة", bucket: "A" },
      { text: "أستطيع تدبير أمري، لكنني أفتقر لصياغة رسائل احترافية أو التعبير بقوة في النقاشات المهنية", bucket: "B" },
      { text: "أتعامل معها بكل ثقة وسلاسة دون أي عائق وظيفي", bucket: "C" },
    ],
  },
  {
    text: "ما هو العائق الأكبر عند كتابة تقرير قصير أو تعبير بالإنجليزية؟",
    options: [
      { text: "إملاء الكلمات، القواعد الأساسية، وكيفية ربط الجمل", bucket: "A" },
      { text: "أستطيع الكتابة، لكنني أشعر بتكرار نفس الكلمات البسيطة وأفتقر للمفردات المتقدمة", bucket: "B" },
      { text: "ليس لدي أي عائق كتابي وأملك حصيلة لغوية مزدهرة", bucket: "C" },
    ],
  },
  {
    text: "ما هو الحاجز النفسي أو الهدف الذي تبحث عن حلّه فوراً؟",
    options: [
      { text: "الخوف الشديد من الخطأ والإحراج أثناء التحدث (كسر حاجز الخوف)", bucket: "A" },
      { text: "الرغبة في تطوير مهارات المحادثة أو إنجليزية الأعمال للسفر أو الترقية", bucket: "B" },
      { text: "صقل المهارات لأقصى درجة والوصول لطلاقة تامة", bucket: "C" },
    ],
  },
];

const DIAGNOSTIC_OUTCOMES = {
  buckets: [
    {
      key: "A",
      emoji: "🌱",
      title: "مستوى المبتدئ وبناء الأساس (A1-A2)",
      description: "يعتمد على الترجمة الحرفية الفردية ويحتاج لتطوير مهارات التعبير والإنتاج اللغوي التلقائي.",
      program: "المستوى المبتدئ (A1 - A2)",
      color: "#22c55e",
    },
    {
      key: "B",
      emoji: "🌳",
      title: "مستوى التعبير والطلاقة (B1-B2)",
      description: "يمتلك أساساً جيداً في القواعد والتواصل وتنقصه الممارسة والطلاقة المتقدمة في البيئة المهنية.",
      program: "المستوى المتوسط (B1 - B2)",
      color: "#f59e0b",
    },
    {
      key: "C",
      emoji: "🚀",
      title: "مستوى الطلاقة والصقل المتقدم (C1)",
      description: "حصيلة لغوية ممتازة ولغة قوية، وهدفه صقل المهارات للوصول لطلاقة تامة وتخصصية.",
      program: "المستوى المتقدم (C1)",
      color: "#8b5cf6",
    },
  ],
  tie: {
    key: "TIE",
    emoji: "🔄",
    title: "مستوى الانتقال والتطوير",
    description: "يفهم الفكرة العامة بوضوح لكنه يتعثر أحياناً في الإنتاج اللغوي والتعبير الفوري.",
    program: "مستوى التجسير والتطوير",
    color: "#14b8a6",
  },
};

let seeded = false;

export async function ensureSeed() {
  if (seeded) return;
  try {
    // 1. Ensure staff users exist
    let duaa = await db.user.findFirst({
      where: { OR: [{ username: "duaa" }, { username: "962788696958" }] },
    });
    if (!duaa) {
      duaa = await db.user.create({
        data: {
          username: "duaa",
          name: "د. دعاء البيساني",
          role: "instructor",
          passwordHash: hashPassword("duaa2026"),
        },
      });
    } else if (duaa.name !== "د. دعاء البيساني") {
      await db.user.update({
        where: { id: duaa.id },
        data: { name: "د. دعاء البيساني" },
      });
    }

    let superUser = await db.user.findFirst({
      where: { OR: [{ username: "super" }, { username: "971564642654" }] },
    });
    if (!superUser) {
      superUser = await db.user.create({
        data: {
          username: "super",
          name: "مدير النظام (سوبر أدمن)",
          role: "super",
          passwordHash: hashPassword("super2026"),
        },
      });
    }

    // Update existing diagnostic & placement test details to reflect Dr. Duaa's full name & accreditation
    await db.test.updateMany({
      where: { slug: "tashkhees" },
      data: {
        description: "اختبار تشخيصي من 5 أسئلة وفق الدليل التشخيصي المعتمد، يقيس حاجزك النفسي ونمط معالجتك اللغوية ليقترح لك المستوى والمسار الأمثل للبدء به.",
        accreditation: `${ACCREDITATION_TEXT}\n${ACCREDITATION_FOOTER}`,
        outcomesJson: JSON.stringify(DIAGNOSTIC_OUTCOMES),
      },
    });

    await db.test.updateMany({
      where: { slug: "placement" },
      data: {
        accreditation: `${ACCREDITATION_TEXT}\n${ACCREDITATION_FOOTER}`,
      },
    });

    // 2. Ensure system tests exist
    const testCount = await db.test.count();
    if (testCount > 0) {
      seeded = true;
      return;
    }

    // ===== System test 1: CEFR Placement (locked) =====
    const placement = await db.test.create({
      data: {
        slug: "placement",
        title: "اختبار تحديد المستوى — مغامرة المستوى",
        description:
          "اختبار تفاعلي ممتع من 20 سؤالاً مصوّراً لقياس مستواك الحقيقي في اللغة الإنجليزية وفق الإطار الأوروبي المرجعي (CEFR) مع نتيجة فورية وتوصية بالمستوى المناسب.",
        language: "en",
        kind: "points",
        isSystem: true,
        isPublished: true,
        emoji: "🚀",
        color: "#7c3aed",
        levelTag: "CEFR",
        passPercent: 50,
        accreditation: `${ACCREDITATION_TEXT}\n${ACCREDITATION_FOOTER}`,
        ownerId: duaa.id,
      },
    });
    await db.question.createMany({
      data: QUESTIONS.map((q, i) => ({
        testId: placement.id,
        order: i,
        type: q.type === "picture" ? "picture" : q.type === "reading" ? "reading" : "choice",
        text: q.question,
        passage: q.passage ?? "",
        emoji: q.emoji ?? "",
        optionsJson: JSON.stringify(q.options.map((t) => ({ text: t }))),
        answerIndex: q.answer,
        points: 5,
      })),
    });

    // ===== System test 2: Diagnostic (from the PDF, locked) =====
    const diagnostic = await db.test.create({
      data: {
        slug: "tashkhees",
        title: "الاختبار التشخيصي — تحديد المسار الأمثل",
        description:
          "اختبار تشخيصي من 5 أسئلة وفق الدليل التشخيصي المعتمد، يقيس حاجزك النفسي ونمط معالجتك اللغوية ليقترح لك المستوى والمسار الأمثل للبدء به.",
        language: "ar",
        kind: "diagnostic",
        isSystem: true,
        isPublished: true,
        emoji: "🧭",
        color: "#0e7490",
        levelTag: "general",
        accreditation: `${ACCREDITATION_TEXT}\n${ACCREDITATION_FOOTER}`,
        outcomesJson: JSON.stringify(DIAGNOSTIC_OUTCOMES),
        ownerId: duaa.id,
      },
    });
    await db.question.createMany({
      data: DIAGNOSTIC_QUESTIONS.map((q, i) => ({
        testId: diagnostic.id,
        order: i,
        type: "choice",
        text: q.text,
        optionsJson: JSON.stringify(q.options),
        points: 1,
      })),
    });

    seeded = true;
    console.log("✅ Seed completed: users + placement + diagnostic tests");
  } catch (err) {
    console.error("Seed error:", err);
  }
}
