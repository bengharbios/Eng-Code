"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { playClick } from "@/lib/sounds";

const FEATURES = [
  {
    emoji: "🎯",
    title: "٢٠ سؤالاً تفاعلياً",
    desc: "أسئلة مصوّرة وممتعة تتصاعد مع مستواك",
    color: "bg-amber-100 border-amber-300",
  },
  {
    emoji: "🖼️",
    title: "صور وشخصيات مرحة",
    desc: "تصميم يشبه الألعاب التعليمية للأطفال",
    color: "bg-pink-100 border-pink-300",
  },
  {
    emoji: "🏆",
    title: "نتيجة فورية",
    desc: "مستواك حسب المعايير العالمية CEFR",
    color: "bg-teal-100 border-teal-300",
  },
];

export default function WelcomeScreen({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-52 h-52 sm:w-64 sm:h-64"
        >
          <Image
            src="/images/mascot-welcome.png"
            alt="بومة معلمة لطيفة ترحب بالطلاب"
            fill
            priority
            className="object-contain drop-shadow-xl" sizes="(max-width: 640px) 208px, 256px"
          />
        </motion.div>
        <motion.span
          className="absolute -top-2 -right-4 text-4xl"
          animate={{ rotate: [0, 20, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl sm:text-6xl font-extrabold text-center text-purple-900 leading-snug"
      >
        مغامرة <span className="text-orange-500">المستوى</span> 🚀
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-4 text-lg sm:text-2xl text-purple-700 text-center font-semibold"
      >
        اكتشف مستواك في اللغة الإنجليزية بطريقة ممتعة!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -6, rotate: i === 1 ? 0 : i === 0 ? -1.5 : 1.5 }}
            className={`card-fun p-5 text-center border-2 ${f.color} bg-opacity-70`}
          >
            <div className="text-4xl mb-2">{f.emoji}</div>
            <div className="font-bold text-purple-900 text-lg">{f.title}</div>
            <div className="text-sm text-purple-600 mt-1 leading-relaxed">
              {f.desc}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <Button
          onClick={() => {
            playClick();
            onStart();
          }}
          className="btn-fun bg-gradient-to-l from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white text-2xl px-14 py-7 h-auto"
          style={{ ["--btn-fun-shadow" as string]: "#c2410c" }}
        >
          🎮 يلا نبدأ!
        </Button>
        <p className="text-purple-500 text-sm font-semibold">
          ⏱️ يستغرق الاختبار حوالي ١٠ دقائق فقط
        </p>
      </motion.div>
    </div>
  );
}
