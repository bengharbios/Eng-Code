"use client";

import { motion } from "framer-motion";

export default function FunBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/50 to-indigo-50/30 pointer-events-none"
    >
      {/* Soft Ambient Glowing Orbs (Modern Professional Mesh) */}
      <motion.div
        animate={{
          x: [0, 30, 0, -30, 0],
          y: [0, -40, 0, 40, 0],
          scale: [1, 1.1, 1, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-300/25 blur-[90px]"
      />

      <motion.div
        animate={{
          x: [0, -40, 0, 40, 0],
          y: [0, 30, 0, -30, 0],
          scale: [1, 0.9, 1, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 -left-32 w-[30rem] h-[30rem] rounded-full bg-teal-200/30 blur-[100px]"
      />

      <motion.div
        animate={{
          x: [0, 20, 0, -20, 0],
          y: [0, -20, 0, 20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-40 right-1/4 w-[28rem] h-[28rem] rounded-full bg-amber-200/20 blur-[100px]"
      />

      {/* Subtle Professional Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#a855f7_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.06]" />
    </div>
  );
}
