"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/components/SessionProvider";
import { playClick } from "@/lib/sounds";

interface GalleryTest {
  id: string;
  slug: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  kind: string;
  language: string;
  levelTag: string;
  isSystem: boolean;
  questionCount: number;
}

export default function HomeScreen({
  onTake,
  onLogin,
  siteSettings: propsSiteSettings,
  settingsLoaded: propsSettingsLoaded,
}: {
  onTake: (slug: string) => void;
  onLogin: () => void;
  siteSettings?: Record<string, string>;
  settingsLoaded?: boolean;
}) {
  const { t } = useI18n();
  const { user } = useSession();
  const [tests, setTests] = useState<GalleryTest[] | null>(null);
  const [internalSettings, setInternalSettings] = useState<Record<string, string> | null>(null);

  const siteSettings = propsSiteSettings || internalSettings || {};
  const isLoaded = propsSettingsLoaded !== undefined ? propsSettingsLoaded : internalSettings !== null;

  useEffect(() => {
    let alive = true;
    fetch("/api/tests?public=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((testsData) => {
        if (alive) setTests(Array.isArray(testsData) ? testsData : []);
      })
      .catch(() => alive && setTests([]));

    if (propsSiteSettings === undefined) {
      fetch("/api/admin/settings", { cache: "no-store" })
        .then((r) => r.json())
        .then((cfg) => alive && setInternalSettings(cfg || {}))
        .catch(() => alive && setInternalSettings({}));
    }
    return () => {
      alive = false;
    };
  }, [propsSiteSettings]);

  if (!isLoaded || tests === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-16">
        <span className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500 mb-4" />
        <p className="text-purple-600 font-bold text-sm">جاري تحميل المنصة والمحتوى...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-8">
      {/* ===== Welcome Message (if set) ===== */}
      {siteSettings.welcomeMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mb-2 p-4 bg-gradient-to-l from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl text-amber-900 font-bold text-sm text-center"
        >
          {siteSettings.welcomeMessage}
        </motion.div>
      )}

      {/* ===== Hero ===== */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteSettings.mascotUrl || "/images/mascot-welcome.png"}
            alt="بومة معلمة لطيفة"
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl sm:text-5xl font-extrabold text-center text-purple-900 mt-2"
      >
        {siteSettings.heroTitle || siteSettings.siteName || t("appName")}{" "}
        <span className="text-orange-500">🚀</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-3 text-lg text-purple-600 text-center font-semibold max-w-2xl"
      >
        {siteSettings.heroSubtitle || t("tagline")}
      </motion.p>

      {/* ===== Accreditation banner ===== */}
      {siteSettings.showAccreditation !== "false" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 w-full max-w-3xl card-fun p-4 sm:p-5 bg-gradient-to-l from-cyan-50 to-teal-50 !border-cyan-200"
        >
          <div className="flex items-start gap-3">
            {siteSettings.accreditationLogoUrl || siteSettings.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={siteSettings.accreditationLogoUrl || siteSettings.logoUrl}
                alt="شعار المعهد"
                className="w-13 h-13 rounded-xl object-contain border-2 border-cyan-100 bg-white p-1 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl border-2 border-cyan-100 bg-white flex items-center justify-center text-2xl shrink-0">
                🛡️
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-cyan-900 text-base sm:text-lg">
                🛡️ {siteSettings.accreditationTitle || t("accreditationTitle")}
              </h3>
              <p className="text-cyan-800/90 text-sm mt-1 leading-relaxed font-medium">
                {siteSettings.accreditationDesc || t("feature3Desc")}
              </p>
              <p className="text-cyan-600 text-xs mt-1.5 font-bold">
                {siteSettings.accreditationAuthor ||
                  `أ. رضاء البيساني — مؤسسة قيادة التعلم المرح (LFL) × ${
                    siteSettings.instituteName || "معهد السلام الثقافي"
                  }`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== Feature chips ===== */}
      {siteSettings.showFeatures !== "false" && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {[
            {
              emoji: siteSettings.feature1Emoji || "🎯",
              title: siteSettings.feature1Title || t("feature1Title"),
              desc: siteSettings.feature1Desc || t("feature1Desc"),
              color: "bg-amber-100 border-amber-300",
            },
            {
              emoji: siteSettings.feature2Emoji || "⚡",
              title: siteSettings.feature2Title || t("feature2Title"),
              desc: siteSettings.feature2Desc || t("feature2Desc"),
              color: "bg-pink-100 border-pink-300",
            },
            {
              emoji: siteSettings.feature3Emoji || "🛡️",
              title: siteSettings.feature3Title || t("feature3Title"),
              desc: siteSettings.feature3Desc || t("feature3Desc"),
              color: "bg-teal-100 border-teal-300",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6, rotate: i === 1 ? 0 : i === 0 ? -1.5 : 1.5 }}
              className={`card-fun p-4 text-center border-2 ${f.color} bg-opacity-70`}
            >
              <div className="text-3xl mb-1">{f.emoji}</div>
              <div className="font-bold text-purple-900">{f.title}</div>
              <div className="text-xs text-purple-600 mt-1 leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ===== Tests gallery ===== */}
      <div className="mt-10 w-full max-w-4xl scroll-mt-20" id="tests-gallery">
        <h2 className="text-2xl font-extrabold text-purple-900 text-center">
          {t("testsGallery")}
        </h2>
        <p className="text-purple-500 text-center font-semibold text-sm mt-1">
          {t("testsGalleryDesc")}
        </p>

        {tests === null ? (
          <div className="flex justify-center mt-8">
            <span className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-400" />
          </div>
        ) : tests.length === 0 ? (
          <div className="card-fun p-8 text-center mt-6 text-purple-400 font-bold">
            {t("noResults")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {tests.map((test, i) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className="card-fun p-5 flex flex-col"
                style={{ borderColor: test.color + "55" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{ background: test.color + "22", border: `2px solid ${test.color}44` }}
                  >
                    {test.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-purple-900 text-lg leading-snug">
                        {test.title}
                      </h3>
                      {test.isSystem && (
                        <span className="text-[10px] bg-cyan-100 text-cyan-700 border border-cyan-300 rounded-full px-2 py-0.5 font-bold">
                          🔒 {t("locked")}
                        </span>
                      )}
                    </div>
                    <p className="text-purple-600 text-sm mt-1 leading-relaxed line-clamp-2">
                      {test.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] font-bold">
                      {(test as any).ownerName && (
                        <span className="bg-emerald-100 text-emerald-800 rounded-full px-2.5 py-0.5 font-bold">
                          👩‍🏫 {(test as any).ownerName}
                        </span>
                      )}
                      <span className="bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5">
                        {test.questionCount} {t("questionsCount")}
                      </span>
                      <span className="bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5">
                        {test.levelTag === "CEFR"
                          ? "CEFR A1→C1"
                          : "🧭 " + t("kindDiagnostic").split("—")[0]}
                      </span>
                      <span className="bg-teal-100 text-teal-700 rounded-full px-2.5 py-0.5 uppercase">
                        {test.language}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    playClick();
                    onTake(test.slug);
                  }}
                  className="btn-fun mt-4 w-full text-white text-lg py-4"
                  style={{
                    background: `linear-gradient(to left, ${test.color}, ${test.color}cc)`,
                    ["--btn-fun-shadow" as string]: test.color + "99",
                  }}
                >
                  {t("takeTest")}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {!user && (
        <p className="mt-8 text-purple-400 text-sm font-semibold text-center">
          <button onClick={onLogin} className="underline hover:text-purple-600">
            {t("login")}
          </button>{" "}
          — {t("linkNote")}
        </p>
      )}
    </div>
  );
}
