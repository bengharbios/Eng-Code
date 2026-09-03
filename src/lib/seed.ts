import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { QUESTIONS } from "@/lib/quiz-data";

// ===== Accreditation text (from الدليل التشخيصي والاعتماد العلمي) =====
export const ACCREDITATION_TEXT =
  "يستند هذا الاختبار إلى منهجيات علمية حديثة في تعليم اللغات: معايير الإطار الأوروبي المرجعي للغات (CEFR) كأساس للأداء الوظيفي وتحديد المستويات من A1 إلى C1، ومعيار الموقف النفسي (Language Attitude) لقياس تأثير حاجز الخوف من الخطأ (Affective Filter) على الطلاقة، ومعيار المعالجة الفعلية (Core Processing) للتفريق بين الترجمة الحرفية البطيئة والإنتاج اللغوي التلقائي.";

export const ACCREDITATION_FOOTER =
  "إعداد: أ. رضاء البيساني — مؤسسة قيادة التعلم المرح (LFL) | اعتماد: معهد السلام التثقافي";

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
      description: "يعتمد على الترجمة الحرفية ويعاني من حاجز نفسي قوي.",
      program: "برنامج الإنجليزية العامة التأسيسي (General English)",
      color: "#22c55e",
    },
    {
      key: "B",
      emoji: "🌳",
      title: "مستوى التعبير والطلاقة المهنية (B1-B2)",
      description: "يمتلك أساساً جيداً ويحتاج لدعم مهارات المحادثة والأعمال.",
      program: "برنامج المحادثة التفاعلية أو إنجليزية الأعمال (Conversational / Business English)",
      color: "#f59e0b",
    },
    {
      key: "C",
      emoji: "🚀",
      title: "مستوى الطلاقة والصقل المتقدم (C1)",
      description: "حصيلة لغوية ممتازة ولغة قوية وهدف التطور التخصصي.",
      program: "الدورات المتقدمة أو التخصصية (Advanced / ESP)",
      color: "#8b5cf6",
    },
  ],
  tie: {
    key: "TIE",
    emoji: "🔄",
    title: "مستوى الانتقال / التذبذب",
    description: "يفهم جيداً لكنه يتعثر في الإنتاج اللغوي.",
    program: "برنامج المحادثة التأسيسية الموجهة (Core Conversation)",
    color: "#14b8a6",
  },
};

let seeded = false;

export async function ensureSeed() {
  if (seeded) return;
  try {
    const count = await db.user.count();
    if (count > 0) {
      seeded = true;
      return;
    }

    // ===== Users =====
    const superUser = await db.user.create({
      data: {
        username: "super",
        name: "مدير النظام (سوبر أدمن)",
        role: "super",
        passwordHash: hashPassword("webinar2026"),
      },
    });
    const duaa = await db.user.create({
      data: {
        username: "duaa",
        name: "الدكتورة دعاء",
        role: "instructor",
        passwordHash: hashPassword("duaa2026"),
      },
    });
    await db.user.create({
      data: {
        username: "ridha",
        name: "أ. رضاء البيساني",
        role: "instructor",
        passwordHash: hashPassword("ridha2026"),
      },
    });

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
          "اختبار تشخيصي من 5 أسئلة وفق الدليل التشخيصي المعتمد، يقيس مهاراتك اللغوية الأربع وحاجزك النفسي ليقترح لك البرنامج الأمثل للبدء به.",
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
