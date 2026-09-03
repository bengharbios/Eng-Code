"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { playClick } from "@/lib/sounds";
import type { StudentAttemptRow } from "@/lib/shared-types";

export default function StudentLookup({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<StudentAttemptRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    playClick();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/attempts?phone=${encodeURIComponent(phone.trim())}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-6">
          <span className="text-6xl">🎒</span>
          <h2 className="text-3xl font-extrabold text-purple-900 mt-2">
            {t("studentLookupTitle")}
          </h2>
          <p className="text-purple-600 mt-2 font-semibold">{t("studentLookupDesc")}</p>
        </div>

        <div className="card-fun p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder={t("phonePlaceholder")}
              dir="ltr"
              inputMode="tel"
              className="h-12 text-lg rounded-2xl border-2 border-purple-200 text-left flex-1"
            />
            <Button
              onClick={search}
              disabled={loading}
              className="btn-fun bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white text-lg px-8 py-5 h-auto"
              style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
            >
              {loading ? "..." : `🔍 ${t("search")}`}
            </Button>
          </div>
        </div>

        {rows !== null && (
          <div className="mt-6 space-y-4">
            {rows.length === 0 ? (
              <div className="card-fun p-8 text-center text-purple-400 font-bold">
                {t("noResults")}
              </div>
            ) : (
              rows.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card-fun p-5 flex items-center gap-4 flex-wrap"
                >
                  <div className="text-4xl">{r.testEmoji || "📝"}</div>
                  <div className="flex-1 min-w-[180px]">
                    <h3 className="font-extrabold text-purple-900">{r.testTitle}</h3>
                    <p className="text-purple-500 text-sm font-semibold">
                      {new Date(r.createdAt).toLocaleDateString("ar", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-extrabold text-orange-500">
                      {r.percentage}%
                    </div>
                    <div className="text-xs text-purple-400 font-bold">
                      {r.score}/{r.total}
                    </div>
                  </div>
                  <span className="bg-purple-100 text-purple-700 rounded-full px-3 py-1.5 font-bold text-sm">
                    {r.levelName}
                  </span>
                  {r.program && (
                    <p className="w-full text-sm text-purple-600 font-semibold bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      🎓 {r.program}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-purple-500 font-bold rounded-full"
          >
            {t("backHome")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
