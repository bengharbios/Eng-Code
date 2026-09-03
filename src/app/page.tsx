"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen from "@/components/quiz/WelcomeScreen";
import RegisterForm from "@/components/quiz/RegisterForm";
import QuizScreen, { type QuizResult } from "@/components/quiz/QuizScreen";
import ResultScreen from "@/components/quiz/ResultScreen";
import AdminDashboard from "@/components/quiz/AdminDashboard";
import FunBackground from "@/components/quiz/FunBackground";

type View = "welcome" | "register" | "quiz" | "result" | "admin";

interface StudentInfo {
  id: string;
  name: string;
}

export default function Home() {
  const [view, setView] = useState<View>("welcome");
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  const views: Record<View, React.ReactNode> = {
    welcome: <WelcomeScreen onStart={() => setView("register")} />,
    register: (
      <RegisterForm
        onSuccess={(id, name) => {
          setStudent({ id, name });
          setView("quiz");
        }}
      />
    ),
    quiz: student ? (
      <QuizScreen
        studentName={student.name}
        studentId={student.id}
        onFinish={(r) => {
          setResult(r);
          setView("result");
        }}
      />
    ) : null,
    result: result && student ? (
      <ResultScreen
        result={result}
        studentId={student.id}
        studentName={student.name}
        onRetake={() => {
          setResult(null);
          setView("welcome");
        }}
      />
    ) : null,
    admin: <AdminDashboard onBack={() => setView("welcome")} />,
  };

  return (
    <main className="relative min-h-screen flex flex-col">
      <FunBackground />

      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b-2 border-purple-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setView(student && result ? "result" : "welcome")}
            className="flex items-center gap-2 group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">
              🦉
            </span>
            <span className="font-extrabold text-xl text-purple-900">
              مغامرة المستوى
            </span>
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 font-bold rounded-full px-4 py-1.5 text-sm">
            🎓 ويبينار {new Date().getFullYear()} — اختبار تحديد المستوى
          </span>
        </div>
      </header>

      {/* Views */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
          >
            {views[view]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating admin button */}
      {view !== "admin" && (
        <button
          onClick={() => setView("admin")}
          className="fixed bottom-4 left-4 z-30 flex items-center gap-2 bg-white/90 backdrop-blur border-2 border-purple-200 text-purple-700 font-bold rounded-full px-4 py-2.5 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
          title="لوحة تحكم المشرف"
        >
          🔐 الإدارة
        </button>
      )}

      {/* Footer */}
      <footer className="mt-auto bg-purple-900 text-purple-200 py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm font-semibold">
          <span>🦉 مغامرة المستوى — اختبار تفاعلي لتحديد مستوى اللغة الإنجليزية</span>
          <span>
            للتواصل الأكاديمي: <span dir="ltr">042899688</span> 📞
          </span>
        </div>
      </footer>
    </main>
  );
}
