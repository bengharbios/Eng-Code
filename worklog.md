# Worklog

---
Task ID: 1
Agent: Main Agent (Super Z)
Task: بناء تطبيق ويب تفاعلي لاختبار تحديد مستوى اللغة الإنجليزية (ويبينار الدكتورة دعاء)

Work Log:
- (الإصدار 1) تطبيق اختبار CEFR التفاعلي مع لوحة أدمن — انظر الأرشيف في git التاريخ

Stage Summary:
- الإصدار 1 استُبدل بهيكل متعدد الأدوار في المهمة 2

---
Task ID: 2
Agent: Main Agent (Super Z)
Task: تطوير النظام إلى منصة متعددة الأدوار (سوبر أدمن / محاضرين / طلبة) مع تعدد اللغات واختبار تشخيصي من PDF وتصدير Excel

Work Log:
- قراءة المرفقات: الدليل_التشخيصي_والاعتماد_العلمي.pdf (5 أسئلة تشخيصية أ/ب/ج + جدول الترشيح + الاعتماد العلمي CEFR/Language Attitude/Core Processing — أ. رضاء البيساني، مؤسسة قيادة التعلم المرح) + شعار معهد السلام التثقافي (preview.webp)
- Prisma جديد: User (super/instructor، كلمات مرور scrypt)، Test (slug، kind: points/diagnostic، isSystem مقفل، accreditation، outcomesJson)، Question (optionsJson مع buckets)، Student (phone@unique)، Attempt (نتائج لكل اختبار)
- المصادقة: جلسات HMAC موقعة في httpOnly cookie — src/lib/auth.ts + /api/auth/{login,logout,me}
- البذر التلقائي ensureSeed: super/super2026، duaa/duaa2026، ridha/ridha2026 + اختبار placement مقفل (20 سؤال) + اختبار tashkhees تشخيصي مقفل (5 أسئلة من PDF مع نتائج البرامج الأربعة)
- i18n كامل (عربي/إنجليزي/فرنسي) بمزود عميل + مبدّل لغة في الهيدر + دعم اتجاه RTL/LTR حسب لغة الاختبار (10 لغات محتوى للاختبارات)
- API: /api/tests CRUD (ملكية + قفل النظام)، /api/take/[slug] (عام بلا إجابات)، /api/attempts (تصحيح سيرفر للنمطين + استعلام طالب بالهاتف)، /api/instructors CRUD (سوبر فقط)، /api/export (ملف xlsx عربي عبر SheetJS)
- الواجهات: رئيسية بمعرض اختبارات + بانر اعتماد بشعار المعهد، تدفق اختبار (مقدمة تعرض الاعتماد العلمي → تسجيل → أسئلة بنمطين → نتيجة + حجز Zoom)، نتيجتي (استعلام بالهاتف)، لوحة محاضر (اختباراتي + نسخ الرابط + نشر/إيقاف + نتائج)، محرر اختبارات كامل (أنواع أسئلة، خيارات، إجابات/تصنيفات، درجات، مؤقت، ألوان، لغات، نتائج تشخيصية)، لوحة سوبر أدمن (إحصائيات + إدارة محاضرين: إنشاء/إيقاف/كلمة مرور/حذف + كل الاختبارات + كل النتائج)
- الروابط: /?t=slug تُبنى بـ window.location.origin وقت العرض → متوافقة مع Vercel تلقائياً
- إصلاحات أثناء التحقق: إعادة توليد عميل Prisma وإعادة تشغيل السيرفر، phone@unique للطالب، أخطاء lint (setState في effects)، تكرار رمز الدرع
- تحقق بالمتصفح: تدفق تشخيصي كامل (خالد → نتيجة B1-B2 + برنامج Conversational حسب جدول PDF)، استعلام الطالب بالهاتف، دخول سوبر وإنشاء محاضرة sara، إنشاء اختبار فرنسي من المحرر، تصحيح placement عبر API (100% → C1)، تصدير Excel (رؤوس عربية سليمة)، تبديل اللغة EN (LTR)، جوال متجاوب
- تنظيف بيانات التجارب: 0 طلبة/0 محاولات، بقي: 4 مستخدمين + اختباران نظاميان (25 سؤالاً)

Stage Summary:
- الحسابات: super/super2026 (سوبر) — duaa/duaa2026 — ridha/ridha2026 — sara/sara2026 (محاضرين)
- الاختبار المقفل "placement": /?t=placement — الاختبار التشخيصي "tashkhees": /?t=tashkhees
- لرفع Vercel: تغيير provider في schema إلى postgres (Neon) + DATABASE_URL + SESSION_SECRET env ثم bunx prisma db push — البذر تلقائي
