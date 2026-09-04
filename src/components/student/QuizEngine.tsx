"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useI18n, isRtlLang } from "@/lib/i18n";
import { playFinish, playClick } from "@/lib/sounds";
import { ENCOURAGEMENTS } from "@/lib/quiz-data";
import type { PublicTest, StudentRegInfo } from "@/lib/shared-types";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function burst(x = 0.5, y = 0.45) {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { x, y },
    colors: ["#f59e0b", "#f97316", "#a855f7", "#14b8a6", "#ec4899"],
    disableForReducedMotion: true,
  });
}

export default function QuizEngine({
  test,
  student,
  onComplete,
  onExit,
}: {
  test: PublicTest;
  student: StudentRegInfo;
  onComplete: (answers: { questionId: string; selected: number }[]) => void;
  onExit: () => void;
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    test.timeLimitMin > 0 ? test.timeLimitMin * 60 : null
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const answersRef = useRef<{ questionId: string; selected: number }[]>([]);
  const submittedRef = useRef(false);

  const handleExitClick = () => {
    if (answersRef.current.length > 0) {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  const confirmExitAndCalculate = () => {
    setShowExitConfirm(false);
    if (answersRef.current.length > 0) {
      onComplete([...answersRef.current]);
    } else {
      onExit();
    }
  };

  const q = test.questions[index];
  const total = test.questions.length;
  const isDiagnostic = test.kind === "diagnostic";
  const qRtl = isRtlLang(test.language);
  const progress = ((index + (selected !== null ? 1 : 0)) / total) * 100;
  const encouragement = useMemo(
    () => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)],
    [index]
  );

  const finish = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (!muted) playFinish();
    setTimeout(() => burst(0.5, 0.4), 200);
    setTimeout(() => burst(0.3, 0.5), 450);
    setTimeout(() => burst(0.7, 0.5), 700);
    setTimeout(() => onComplete([...answersRef.current]), 900);
  };

  // ===== Timer =====
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const id = setTimeout(() => setTimeLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    answersRef.current.push({ questionId: q.id, selected: i });
    if (!muted) playClick();
  };

  const handleNext = () => {
    if (selected === null) return;
    if (index < total - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      finish();
    }
  };

  const mm = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const ss = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-6">
      {/* ===== Header ===== */}
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between gap-3 mb-2">
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-2xl bg-white rounded-full w-11 h-11 shadow-sm border-2 border-purple-100 hover:scale-110 transition-transform"
            aria-label={muted ? "sound" : "mute"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <span className="font-bold text-purple-800 bg-white rounded-full px-4 py-1.5 shadow-sm border-2 border-purple-100">
            {t("question")} {index + 1} {t("of")} {total}
          </span>
          {timeLeft !== null ? (
            <span
              className={`font-extrabold rounded-full px-4 py-1.5 border-2 ${
                timeLeft < 60
                  ? "bg-red-50 text-red-600 border-red-300 animate-pulse"
                  : "bg-white text-orange-600 border-orange-200"
              }`}
            >
              ⏱️ {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </span>
          ) : (
            <span className="w-11" />
          )}
        </div>
        <div className="h-5 bg-purple-100 rounded-full overflow-hidden border-2 border-purple-200 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-orange-400 via-amber-400 to-yellow-300"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* ===== Mascot bubble ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bubble-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 mt-4 w-full max-w-3xl"
        >
          <div className="relative w-14 h-14 shrink-0">
            <Image
              src="/images/mascot-welcome.png"
              alt="البومة المعلمة"
              fill
              sizes="56px"
              className="object-contain"
            />
          </div>
          <div className="bg-white border-2 border-purple-200 rounded-2xl rounded-tr-sm px-4 py-2 shadow-sm">
            <p className="text-purple-700 font-bold text-sm sm:text-base">
              {student.name}، {encouragement}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ===== Question card ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: -40, rotate: -1 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: 40, rotate: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-3xl mt-4"
        >
          <div className="card-fun p-6 sm:p-8">
            {q.type === "picture" && q.emoji && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="flex justify-center mb-5"
              >
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 border-4 border-amber-200 flex items-center justify-center shadow-inner">
                  <span className="text-[5.5rem] sm:text-[6.5rem] leading-none select-none">
                    {q.emoji}
                  </span>
                </div>
              </motion.div>
            )}

            {q.type === "reading" && q.passage && (
              <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl p-4 sm:p-5 mb-5">
                <p
                  dir={qRtl ? "rtl" : "ltr"}
                  className={`text-purple-900 leading-relaxed text-base sm:text-lg font-medium ${
                    qRtl ? "text-right" : "text-left"
                  }`}
                >
                  {q.passage}
                </p>
              </div>
            )}

            <h2
              dir={qRtl ? "rtl" : "ltr"}
              className={`text-center font-extrabold text-purple-900 text-2xl sm:text-3xl leading-relaxed mb-6 ${
                qRtl ? "" : "dir-ltr"
              }`}
            >
              {q.text}
            </h2>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${qRtl ? "" : "dir-ltr"}`}>
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const answered = selected !== null;
                let cls = "option-btn";
                if (answered && isSelected) {
                  cls = isDiagnostic
                    ? "option-btn !border-teal-500 !bg-teal-50"
                    : "option-btn !border-purple-500 !bg-purple-50";
                } else if (answered) {
                  cls = "option-btn opacity-50";
                }
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    whileTap={!answered ? { scale: 0.97 } : {}}
                    className={`${cls} flex items-center gap-3 p-4 text-left min-h-[64px]`}
                  >
                    <span
                      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-lg ${
                        answered && isSelected
                          ? isDiagnostic
                            ? "bg-teal-500 text-white"
                            : "bg-purple-500 text-white"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {answered && isSelected ? (isDiagnostic ? "✓" : "★") : LETTERS[i]}
                    </span>
                    <span
                      dir={qRtl ? "rtl" : "ltr"}
                      className={`font-bold text-lg leading-snug text-purple-900 ${
                        qRtl ? "text-right" : "text-left"
                      }`}
                    >
                      {opt}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <p className="font-extrabold text-xl text-teal-600">{t("answerSaved")}</p>
                  <Button
                    onClick={handleNext}
                    className="btn-fun bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-lg px-8 py-5 h-auto"
                    style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
                  >
                    {index < total - 1 ? t("next") : t("seeResult")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={handleExitClick}
        className="mt-6 text-purple-300 hover:text-purple-500 font-bold text-sm"
      >
        {t("backToTests")}
      </button>

      {/* ===== Exit confirm modal ===== */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card-fun p-6 max-w-md w-full text-center space-y-4 bg-white shadow-2xl"
            >
              <div className="text-5xl">⚠️</div>
              <h3 className="text-2xl font-extrabold text-purple-900">تنبيه الخروج من الاختبار</h3>
              <p className="text-purple-700 font-semibold text-sm leading-relaxed">
                أنت تجري الاختبار حالياً! عند الخروج الآن، ستتحصل على نتيجة الأسئلة التي قمت بإجابتها فقط ({answersRef.current.length} من {total}) وسيتم إظهار نتيجتك وحفظها قبل الخروج.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button
                  onClick={confirmExitAndCalculate}
                  className="btn-fun flex-1 bg-gradient-to-l from-orange-500 to-amber-400 text-white font-bold py-3.5 text-base"
                >
                  {answersRef.current.length > 0 ? "حساب النتيجة والإغلاق" : "الخروج من الاختبار"}
                </Button>
                <Button
                  onClick={() => setShowExitConfirm(false)}
                  variant="outline"
                  className="flex-1 rounded-full font-bold border-purple-200 text-purple-700 py-3.5 text-base"
                >
                  متابعة الاختبار
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
