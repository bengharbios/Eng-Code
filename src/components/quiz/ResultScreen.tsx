"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LEVELS, getStarsByPercent, type LevelInfo } from "@/lib/quiz-data";
import type { QuizResult } from "./QuizScreen";
import { ACADEMIC_PHONE, ACADEMIC_PHONE_INTL, DR_NAME } from "@/lib/config";

export default function ResultScreen({
  result,
  studentId,
  studentName,
  onRetake,
}: {
  result: QuizResult;
  studentId: string;
  studentName: string;
  onRetake: () => void;
}) {
  const { toast } = useToast();
  const [wantsInterview, setWantsInterview] = useState(false);
  const [savingInterview, setSavingInterview] = useState(false);

  const level: LevelInfo =
    LEVELS.find((l) => l.code === result.levelCode) ?? LEVELS[0];
  const stars = getStarsByPercent(result.percentage);

  useEffect(() => {
    const t1 = setTimeout(
      () =>
        confetti({
          particleCount: 130,
          spread: 100,
          origin: { x: 0.5, y: 0.35 },
          colors: ["#f59e0b", "#f97316", "#a855f7", "#14b8a6", "#ec4899"],
          disableForReducedMotion: true,
        }),
      300
    );
    const t2 = setTimeout(
      () =>
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.6 },
          colors: ["#f59e0b", "#f97316", "#a855f7"],
          disableForReducedMotion: true,
        }),
      700
    );
    const t3 = setTimeout(
      () =>
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.6 },
          colors: ["#14b8a6", "#ec4899", "#facc15"],
          disableForReducedMotion: true,
        }),
      1000
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const requestInterview = async () => {
    setSavingInterview(true);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId, wantsInterview: true }),
      });
      if (!res.ok) throw new Error();
      setWantsInterview(true);
      toast({
        title: "تم تسجيل رغبتك بنجاح! 🎥",
        description: "تواصل معنا الآن لتأكيد موعد المقابلة",
      });
    } catch {
      toast({
        title: "تعذّر الحفظ 😅",
        description: "لا تقلق! يمكنك طلب المقابلة مباشرة من الويبينار",
        variant: "destructive",
      });
    } finally {
      setSavingInterview(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-4">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="relative w-40 h-40 mx-auto"
          >
            <Image
              src="/images/mascot-celebrate.png"
              alt="احتفال بالإنجاز"
              fill
              sizes="160px"
              priority
              className="object-contain"
            />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-900 mt-2">
            مبروك {studentName}! 🎉
          </h1>
          <p className="text-purple-600 font-semibold mt-1">
            أكملت الاختبار، وهذه نتيجتك الرسمية
          </p>
        </div>

        {/* ===== Level card ===== */}
        <div
          className="card-fun p-6 sm:p-8 text-center border-4"
          style={{ borderColor: level.color, background: level.bg + "66" }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="text-7xl mb-2"
          >
            {level.emoji}
          </motion.div>

          <div
            className="inline-flex items-center gap-2 text-white font-extrabold text-3xl rounded-full px-8 py-2 shadow-lg"
            style={{ background: level.color }}
          >
            مستواك: {level.code}
          </div>

          <h2 className="text-2xl font-extrabold text-purple-900 mt-3">
            {level.nameAr}{" "}
            <span dir="ltr" className="text-purple-500 text-xl">
              ({level.nameEn})
            </span>
          </h2>

          {/* Stars */}
          <div className="flex justify-center gap-1.5 my-4" dir="ltr">
            {[...Array(5)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
                className={`text-4xl ${
                  i < stars ? "" : "opacity-25 grayscale"
                }`}
              >
                ⭐
              </motion.span>
            ))}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="bg-white/90 rounded-2xl px-6 py-3 border-2 border-purple-100 shadow-sm">
              <span className="text-3xl font-extrabold text-purple-800">
                {result.score}
              </span>
              <span className="text-purple-400 font-bold"> / {result.total}</span>
              <span className="block text-sm text-purple-500 font-semibold">
                النقاط
              </span>
            </div>
            <div className="bg-white/90 rounded-2xl px-6 py-3 border-2 border-purple-100 shadow-sm">
              <span className="text-3xl font-extrabold text-orange-500">
                {result.percentage}%
              </span>
              <span className="block text-sm text-purple-500 font-semibold">
                نسبة الإتقان
              </span>
            </div>
          </div>

          <p className="text-purple-800 leading-relaxed mt-5 text-base sm:text-lg font-medium">
            {level.description}
          </p>
        </div>

        {/* ===== Recommended course ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-5 bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white rounded-3xl p-5 sm:p-6 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎓</span>
            <div>
              <p className="font-bold text-lg">المستوى المناسب لك في الأكاديمية:</p>
              <p className="text-2xl font-extrabold">
                دورة {level.nameAr} — {level.code}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ===== Zoom interview ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="card-fun mt-5 p-6 sm:p-7"
        >
          <div className="flex items-start gap-3">
            <span className="text-4xl">🎥</span>
            <div className="flex-1">
              <h3 className="font-extrabold text-purple-900 text-xl">
                هل تريد تحديد مستواك بدقة أكبر؟
              </h3>
              <p className="text-purple-600 font-medium mt-1 leading-relaxed">
                يمكنك التقديم على مقابلة شخصية عبر <b>Zoom</b> مع {DR_NAME}{" "}
                لتقييم محاورتك وتحديد مستواك بشكل أدق.
              </p>

              {!wantsInterview ? (
                <Button
                  onClick={requestInterview}
                  disabled={savingInterview}
                  className="btn-fun mt-4 bg-gradient-to-l from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-lg px-8 py-5 h-auto"
                  style={{ ["--btn-fun-shadow" as string]: "#0f766e" }}
                >
                  {savingInterview ? "جاري التسجيل..." : "✅ نعم، أريد حجز مقابلة Zoom"}
                </Button>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="bg-teal-50 border-2 border-teal-300 text-teal-800 rounded-2xl px-4 py-3 font-bold">
                    🎊 تم تسجيل رغبتك في المقابلة! الخطوة التالية:
                  </div>
                  <ul className="space-y-2 text-purple-800 font-semibold">
                    <li className="flex items-start gap-2">
                      <span>1️⃣</span>
                      اطلب ذلك من {DR_NAME} مباشرة في الويبينار الآن.
                    </li>
                    <li className="flex items-start gap-2">
                      <span>2️⃣</span>
                      أو تواصل مع الفريق الأكاديمي:
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`tel:${ACADEMIC_PHONE}`}
                      className="btn-fun inline-flex items-center gap-2 bg-gradient-to-l from-orange-500 to-amber-400 text-white text-lg px-6 py-3.5"
                      style={{ ["--btn-fun-shadow" as string]: "#c2410c" }}
                    >
                      📞 <span dir="ltr">{ACADEMIC_PHONE}</span>
                    </a>
                    <a
                      href={`https://wa.me/${ACADEMIC_PHONE_INTL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-fun inline-flex items-center gap-2 bg-gradient-to-l from-green-500 to-emerald-400 text-white text-lg px-6 py-3.5"
                      style={{ ["--btn-fun-shadow" as string]: "#15803d" }}
                    >
                      💬 واتساب الفريق الأكاديمي
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={onRetake}
            variant="ghost"
            className="text-purple-500 font-bold hover:text-purple-700 hover:bg-purple-50 text-lg rounded-full"
          >
            🔄 إعادة الاختبار
          </Button>
        </div>

        <p className="text-center text-xs text-purple-400 font-semibold mt-2 pb-6">
          💜 نتيجتك محفوظة لدينا، وسيتواصل معك الفريق الأكاديمي قريباً
        </p>
      </motion.div>
    </div>
  );
}
