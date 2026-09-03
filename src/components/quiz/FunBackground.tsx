"use client";

import { motion } from "framer-motion";

const FLOATERS = [
  { emoji: "⭐", top: "8%", left: "6%", size: "text-4xl", dur: 6, delay: 0 },
  { emoji: "☁️", top: "14%", left: "84%", size: "text-6xl", dur: 8, delay: 1 },
  { emoji: "🎈", top: "62%", left: "4%", size: "text-5xl", dur: 7, delay: 0.5 },
  { emoji: "🌈", top: "76%", left: "88%", size: "text-5xl", dur: 9, delay: 0.2 },
  { emoji: "✏️", top: "38%", left: "93%", size: "text-3xl", dur: 6.5, delay: 1.4 },
  { emoji: "📚", top: "84%", left: "12%", size: "text-4xl", dur: 7.5, delay: 0.8 },
  { emoji: "🌟", top: "5%", left: "55%", size: "text-2xl", dur: 5.5, delay: 0.3 },
  { emoji: "🎨", top: "45%", left: "2%", size: "text-3xl", dur: 8.5, delay: 1.1 },
  { emoji: "✨", top: "22%", left: "20%", size: "text-2xl", dur: 6, delay: 1.8 },
  { emoji: "🦋", top: "55%", left: "70%", size: "text-3xl", dur: 7, delay: 0.6 },
];

export default function FunBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-fun pointer-events-none"
    >
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          className={`absolute ${f.size} select-none`}
          style={{ top: f.top, left: f.left }}
          animate={{
            y: [0, -18, 0, 12, 0],
            rotate: [0, 8, 0, -8, 0],
          }}
          transition={{
            duration: f.dur,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {f.emoji}
        </motion.span>
      ))}
    </div>
  );
}
