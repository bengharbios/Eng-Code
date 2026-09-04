"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { playClick } from "@/lib/sounds";
import type { PublicTest } from "@/lib/shared-types";

export default function TestsPage({
  onTake,
  onBack,
  siteSettings = {},
}: {
  onTake: (slug: string) => void;
  onBack: () => void;
  siteSettings?: Record<string, string>;
}) {
  const { t } = useI18n();
  const [tests, setTests] = useState<PublicTest[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/tests?public=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (alive) setTests(Array.isArray(data) ? data : []);
      })
      .catch(() => alive && setTests([]));
    return () => {
      alive = false;
    };
  }, []);

  const filteredTests = (tests || []).filter(
    (test) =>
      test.title.toLowerCase().includes(search.toLowerCase()) ||
      (test.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (test.ownerName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-6rem)] flex flex-col">
      {/* Header Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-900 rounded-full px-4 py-1.5 font-extrabold text-sm mb-2">
          🎯 قسم الاختبارات المتاحة
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-900">
          {t("testsGallery")}
        </h1>
        <p className="text-purple-600 font-semibold text-sm mt-1">
          اختر الاختبار المناسب لمستواك وابدأ الإجابة فوراً
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6 max-w-md mx-auto w-full">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 ابحث عن اسم الاختبار أو المحاضر..."
          className="h-12 rounded-2xl border-2 border-purple-200 bg-white/90 text-center font-semibold focus:border-purple-500 shadow-sm"
        />
      </div>

      {/* Test List Cards */}
      {tests === null ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
          <p className="text-purple-600 font-bold animate-pulse">جاري تحميل الاختبارات المتاحة...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="card-fun p-8 text-center my-auto">
          <span className="text-5xl block mb-2">🔍</span>
          <p className="text-purple-700 font-extrabold text-lg">
            {search ? "لا توجد نتائج تطابق بحثك" : t("noResults")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {filteredTests.map((test, i) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="card-fun p-5 flex flex-col justify-between relative overflow-hidden group"
              style={{ borderColor: (test.color || "#8b5cf6") + "55" }}
            >
              <div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-md"
                    style={{ background: test.color || "#8b5cf6" }}
                  >
                    {test.icon || "📝"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-purple-900 text-lg sm:text-xl leading-tight">
                        {test.title}
                      </h3>
                      {test.kind === "diagnostic" && (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                          {t("locked")}
                        </span>
                      )}
                    </div>
                    {test.ownerName && (
                      <p className="text-xs text-purple-500 font-bold mt-1">
                        👩‍🏫 {test.ownerName}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-purple-600 text-sm font-medium mt-3 leading-relaxed line-clamp-3">
                  {test.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-purple-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-purple-500 font-bold">
                  <span>📝 {test.questionsCount || test.questions?.length || 0} {t("questionsCount")}</span>
                  {test.timeLimitMin > 0 && (
                    <span>⏱️ {test.timeLimitMin} {t("minutes")}</span>
                  )}
                </div>

                <Button
                  onClick={() => {
                    playClick();
                    onTake(test.slug);
                  }}
                  className="btn-fun bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white font-extrabold px-6 py-2.5 h-auto text-sm rounded-2xl"
                  style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
                >
                  {t("takeTest")} ←
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Back button */}
      <div className="text-center mt-auto pb-4">
        <button
          onClick={onBack}
          className="text-purple-500 hover:text-purple-700 font-extrabold text-sm"
        >
          {t("backHome")}
        </button>
      </div>
    </div>
  );
}
