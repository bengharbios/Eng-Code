"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import TakeTestIntro from "./TakeTestIntro";
import QuizEngine from "./QuizEngine";
import ResultView from "./ResultView";
import type { PublicTest, StudentRegInfo, SubmitResult } from "@/lib/shared-types";

type Step = "loading" | "error" | "intro" | "quiz" | "result";

export default function TakeTest({
  slug,
  onBack,
}: {
  slug: string;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("loading");
  const [test, setTest] = useState<PublicTest | null>(null);
  const [student, setStudent] = useState<StudentRegInfo | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/take/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (alive) {
          setTest(data);
          setStep("intro");
        }
      })
      .catch(() => alive && setStep("error"));
    return () => {
      alive = false;
    };
  }, [slug]);

  const submitAttempt = useCallback(
    async (answers: { questionId: string; selected: number }[]) => {
      if (!test || !student || submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: test.slug,
            name: student.name,
            phone: student.phone,
            age: parseInt(student.age, 10),
            country: student.country,
            answers,
          }),
        });
        if (!res.ok) throw new Error();
        const data: SubmitResult = await res.json();
        setResult(data);
        setStep("result");
      } catch {
        toast({
          title: "تعذّر إرسال الإجابات 😅",
          description: "تحقق من الاتصال ثم أعد المحاولة",
          variant: "destructive",
        });
        setStep("quiz");
      } finally {
        setSubmitting(false);
      }
    },
    [test, student, submitting, toast]
  );

  if (step === "loading") {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <span className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400" />
      </div>
    );
  }

  if (step === "error" || !test) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-6xl">🔍</span>
        <h2 className="text-2xl font-extrabold text-purple-900">الاختبار غير متاح</h2>
        <p className="text-purple-500 font-semibold">
          قد يكون الرابط خاطئاً أو تم إلغاء نشر الاختبار
        </p>
        <button
          onClick={onBack}
          className="btn-fun bg-purple-600 text-white px-8 py-3.5"
          style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
        >
          ← الرئيسية
        </button>
      </div>
    );
  }

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {step === "intro" && (
        <TakeTestIntro
          test={test}
          onBegin={(info) => {
            setStudent(info);
            setStep("quiz");
          }}
        />
      )}
      {step === "quiz" && student && (
        <QuizEngine
          test={test}
          student={student}
          onComplete={(answers) => submitAttempt(answers)}
          onExit={onBack}
        />
      )}
      {step === "result" && result && student && (
        <ResultView
          result={result}
          studentName={student.name}
          onRetake={() => {
            setResult(null);
            setStep("intro");
          }}
          onBack={onBack}
        />
      )}
      {step === "result" && !result && (
        <div className="min-h-[40vh] flex items-center justify-center">
          <span className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400" />
        </div>
      )}
    </motion.div>
  );
}
