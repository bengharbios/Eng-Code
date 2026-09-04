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
  siteSettings,
}: {
  slug: string;
  onBack: () => void;
  siteSettings?: Record<string, string>;
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
      if (!test || !student) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId: test.id,
            studentName: student.name,
            studentPhone: student.phone,
            studentEmail: student.email || undefined,
            answers,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "خطأ أثناء حفظ النتيجة");
        }
        const data: SubmitResult = await res.json();
        setResult(data);
        setStep("result");
      } catch (e: any) {
        toast({
          title: "تعذر تقديم الاختبار",
          description: e.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [test, student, toast]
  );

  if (step === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <span className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600" />
        <p className="text-purple-600 font-bold animate-pulse">جاري تحميل الاختبار...</p>
      </div>
    );
  }

  if (step === "error" || !test) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-4 text-center">
        <span className="text-6xl">🙈</span>
        <h2 className="text-2xl font-extrabold text-purple-900">الاختبار غير موجود أو مغلق</h2>
        <p className="text-purple-600 font-medium max-w-md">
          تأكد من رابط الاختبار أو تواصل مع الأستاذ المشرف.
        </p>
        <button
          onClick={onBack}
          className="btn-fun bg-purple-600 text-white font-bold px-6 py-3 rounded-2xl"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      {step === "intro" && (
        <TakeTestIntro
          test={test}
          onStart={(info) => {
            setStudent(info);
            setStep("quiz");
          }}
          onBack={onBack}
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
          siteSettings={siteSettings}
        />
      )}
      {step === "result" && !result && (
        <div className="min-h-[40vh] flex items-center justify-center">
          <span className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400" />
        </div>
      )}
    </div>
  );
}
