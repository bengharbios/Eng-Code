"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  QUESTIONS,
  POINTS_PER_QUESTION,
  TYPE_LABELS,
  ENCOURAGEMENTS,
  getLevelByPercent,
  type Question,
} from "@/lib/quiz-data";
import { playCorrect, playWrong, playFinish } from "@/lib/sounds";

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  levelCode: string;
  levelName: string;
  answers: { questionId: number; selected: number; correct: boolean }[];
}

const OPTION_COLORS = [
  "hover:border-orange-400",
  "hover:border-teal-400",
  "hover:border-pink-400",
  "hover:border-amber-400",
];
const LETTERS = ["A", "B", "C", "D"];

function burst(x = 0.5, y = 0.45) {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { x, y },
    colors: ["#f59e0b", "#f97316", "#a855f7", "#14b8a6", "#ec4899"],
    disableForReducedMotion: true,
  });
}

export default function QuizScreen({
  studentName,
  studentId,
  onFinish,
}: {
  studentName: string;
  studentId: string;
  onFinish: (result: QuizResult) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  const answersRef = useRef<
    { questionId: number; selected: number; correct: boolean }[]
  >([]);

  const q: Question = QUESTIONS[index];
  const progress = ((index + (selected !== null ? 1 : 0)) / QUESTIONS.length) * 100;
  const encouragement = useMemo(
    () => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)],
    [index]
  );

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const isCorrect = i === q.answer;
    answersRef.current.push({
      questionId: q.id,
      selected: i,
      correct: isCorrect,
    });
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      if (!muted) playCorrect();
      burst();
    } else {
      if (!muted) playWrong();
    }
  };

  const saveResults = async (result: QuizResult) => {
    try {
      await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: studentId,
          score: result.score,
          total: result.total,
          percentage: result.percentage,
          level: result.levelCode,
          levelName: result.levelName,
          answersJson: JSON.stringify(result.answers),
        }),
      });
    } catch {
      // النتيجة تظهر للطالب على أي حال، ويُعاد المحاولة لاحقاً في شاشة النتيجة
    }
  };

  const handleNext = () => {
    if (selected === null) return;
    if (index < QUESTIONS.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      // Finish → compute result
      if (!muted) playFinish();
      setTimeout(() => burst(0.5, 0.4), 200);
      setTimeout(() => burst(0.3, 0.5), 450);
      setTimeout(() => burst(0.7, 0.5), 700);
      const score = correctCount * POINTS_PER_QUESTION;
      const percentage = Math.round(
        (correctCount / QUESTIONS.length) * 100
      );
      const level = getLevelByPercent(percentage);
      const result: QuizResult = {
        score,
        total: QUESTIONS.length * POINTS_PER_QUESTION,
        percentage,
        levelCode: level.code,
        levelName: level.nameAr,
        answers: [...answersRef.current],
      };
      setFinished(true);
      saveResults(result);
      // إعطاء وقت قصير لحركة الانتقال ثم عرض النتيجة
      setTimeout(() => onFinish(result), 900);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-6">
      {/* ===== Header: progress ===== */}
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-1.5" title="إجاباتك الصحيحة">
            {[...Array(5)].map((_, i) => {
              const filled = correctCount > i * 4; // نجمة كل 4 إجابات صحيحة تقريباً
              return (
                <motion.span
                  key={i}
                  animate={filled ? { scale: [0, 1.4, 1] } : {}}
                  className={`text-xl ${filled ? "" : "opacity-30 grayscale"}`}
                >
                  ⭐
                </motion.span>
              );
            })}
          </div>
          <span className="font-bold text-purple-800 bg-white rounded-full px-4 py-1.5 shadow-sm border-2 border-purple-100">
            السؤال {index + 1} من {QUESTIONS.length}
          </span>
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-2xl bg-white rounded-full w-11 h-11 shadow-sm border-2 border-purple-100 hover:scale-110 transition-transform"
            title={muted ? "تشغيل الأصوات" : "كتم الأصوات"}
            aria-label={muted ? "تشغيل الأصوات" : "كتم الأصوات"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-5 bg-purple-100 rounded-full overflow-hidden border-2 border-purple-200 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-orange-400 via-amber-400 to-yellow-300"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* ===== Mascot speech bubble ===== */}
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
              {studentName}، {encouragement}
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
            {/* Type badge + level */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 bg-amber-100 border-2 border-amber-300 text-amber-800 font-bold rounded-full px-4 py-1 text-sm">
                {TYPE_LABELS[q.type].emoji} {TYPE_LABELS[q.type].ar}
              </span>
              <span className="text-purple-300 font-bold text-sm">
                {q.level}
              </span>
            </div>

            {/* Picture display */}
            {q.type === "picture" && q.emoji && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="flex justify-center mb-5"
              >
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 border-4 border-amber-200 flex items-center justify-center shadow-inner">
                  <span className="text-[6rem] sm:text-[7rem] leading-none select-none">
                    {q.emoji}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Reading passage */}
            {q.type === "reading" && q.passage && (
              <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl p-4 sm:p-5 mb-5">
                <p className="dir-ltr text-left text-purple-900 leading-relaxed text-base sm:text-lg font-medium">
                  {q.passage}
                </p>
              </div>
            )}

            {/* Question text */}
            <h2
              dir="ltr"
              className={`dir-ltr text-center font-extrabold text-purple-900 text-2xl sm:text-3xl leading-relaxed mb-6 ${
                q.type === "grammar" ? "tracking-wide" : ""
              }`}
            >
              {q.question}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.answer;
                const answered = selected !== null;
                let cls = "option-btn";
                let contentCls = "text-purple-900";
                if (answered && isCorrect) {
                  cls = "option-btn !border-green-500 !bg-green-50";
                  contentCls = "text-green-800";
                } else if (answered && isSelected && !isCorrect) {
                  cls = "option-btn !border-red-400 !bg-red-50";
                  contentCls = "text-red-700";
                } else if (answered) {
                  cls = "option-btn opacity-50";
                }
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered || finished}
                    whileTap={!answered ? { scale: 0.97 } : {}}
                    className={`${cls} ${OPTION_COLORS[i % 4]} flex items-center gap-3 p-4 text-left min-h-[64px] ${
                      answered && isSelected && !isCorrect
                        ? "animate-[shake_0.4s_ease]"
                        : ""
                    }`}
                  >
                    <span
                      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-lg ${
                        answered && isCorrect
                          ? "bg-green-500 text-white"
                          : answered && isSelected && !isCorrect
                          ? "bg-red-400 text-white"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {answered && isCorrect ? "✓" : LETTERS[i]}
                    </span>
                    <span
                      className={`font-bold text-lg leading-snug ${contentCls}`}
                    >
                      {opt}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback + Next */}
            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <p
                    className={`font-extrabold text-xl ${
                      selected === q.answer ? "text-green-600" : "text-orange-500"
                    }`}
                  >
                    {selected === q.answer
                      ? "🎉 إجابة صحيحة! أحسنت"
                      : "💛 لا بأس! التعلم من الأخطاء جزء من المغامرة"}
                  </p>
                  <Button
                    onClick={handleNext}
                    className="btn-fun bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-lg px-8 py-5 h-auto"
                    style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
                  >
                    {index < QUESTIONS.length - 1
                      ? "التالي ←"
                      : "🎁 شاهد نتيجتك!"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-6px);
          }
          75% {
            transform: translateX(6px);
          }
        }
      `}</style>
    </div>
  );
}
