"use client";

import { motion } from "framer-motion";
import { playClick } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/components/SessionProvider";

export type BottomNavTab = "home" | "take" | "student" | "login" | "instructor" | "super";

export default function BottomNav({
  currentView,
  onNavigate,
}: {
  currentView: BottomNavTab;
  onNavigate: (view: BottomNavTab) => void;
  isTakingTest?: boolean;
}) {
  const { t } = useI18n();
  const { user } = useSession();

  const isStaff = user && (user.role === "super" || user.role === "instructor");

  const tabs = [
    {
      id: "home" as BottomNavTab,
      label: t("backHome").replace("← ", ""),
      icon: "🏠",
      badge: null,
    },
    {
      id: "take" as BottomNavTab,
      label: t("test"),
      icon: "🎯",
      badge: null,
    },
    {
      id: "student" as BottomNavTab,
      label: t("myResults"),
      icon: "📋",
      badge: null,
    },
    {
      id: "login" as BottomNavTab,
      label: isStaff ? t("dashboard") : user ? t("logout") : t("login"),
      icon: isStaff ? "📊" : user ? "🚪" : "🔑",
      badge: null,
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden pb-safe">
      <div className="mx-3 mb-2 bg-white/90 backdrop-blur-xl border-2 border-purple-200/80 shadow-[0_-6px_25px_rgba(107,33,168,0.12)] rounded-3xl p-1.5 flex items-center justify-around">
        {tabs.map((t) => {
          const isActive =
            currentView === t.id ||
            (t.id === "login" && (currentView === "super" || currentView === "instructor"));

          return (
            <button
              key={t.id}
              onClick={() => {
                playClick();
                onNavigate(t.id);
              }}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all active:scale-90"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-purple-600 rounded-2xl shadow-md"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative z-10 text-xl transition-transform ${isActive ? "scale-110" : ""}`}>
                {t.icon}
              </span>
              <span
                className={`relative z-10 text-[11px] font-extrabold mt-0.5 ${
                  isActive ? "text-white" : "text-purple-700"
                }`}
              >
                {t.label}
              </span>
              {t.badge && !isActive && (
                <span className="absolute -top-1 right-2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-sm">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
