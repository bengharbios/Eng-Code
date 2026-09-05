"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import TestEditor from "./TestEditor";
import AttemptsTable from "./AttemptsTable";
import { playClick } from "@/lib/sounds";
import type { AttemptRow } from "@/lib/shared-types";

interface MyTest {
  id: string;
  slug: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  kind: string;
  language: string;
  isSystem: boolean;
  isPublished: boolean;
  questionCount: number;
  attemptsCount: number;
}

type Tab = "tests" | "editor" | "results";

export default function InstructorDashboard({ userName }: { userName: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("tests");
  const [tests, setTests] = useState<MyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resultsTestId, setResultsTestId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const [res, cfg] = await Promise.all([
        fetch("/api/tests", { cache: "no-store" }),
        fetch("/api/admin/settings", { cache: "no-store" }),
      ]);
      if (res.ok) setTests(await res.json());
      if (cfg.ok) setSiteSettings(await cfg.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const loadResults = useCallback(async (testId: string) => {
    setAttemptsLoading(true);
    try {
      const res = await fetch(`/api/attempts?testId=${encodeURIComponent(testId)}`, {
        cache: "no-store",
      });
      if (res.ok) setAttempts(await res.json());
    } finally {
      setAttemptsLoading(false);
    }
  }, []);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/?t=${slug}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast({ title: t("copied"), description: url }))
      .catch(() => toast({ title: url, description: t("linkNote") }));
  };

  const togglePublish = async (test: MyTest) => {
    const res = await fetch(`/api/tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !test.isPublished }),
    });
    if (res.ok) {
      toast({ title: test.isPublished ? t("unpublish") : t("published") });
      loadTests();
    }
  };

  const deleteTest = async (test: MyTest) => {
    if (test.isSystem) {
      toast({ title: t("systemLockedNote"), variant: "destructive" });
      return;
    }
    if (!confirm(`${t("confirmDelete")}\n${test.title}`)) return;
    const res = await fetch(`/api/tests/${test.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "تم الحذف 🗑️" });
      loadTests();
    } else {
      toast({ title: t("errorGeneric"), variant: "destructive" });
    }
  };

  const openResults = (testId: string) => {
    setResultsTestId(testId);
    setTab("results");
    loadResults(testId);
  };

  // ===== Editor tab =====
  if (tab === "editor") {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto w-full">
        <TestEditor
          testId={editingId}
          onSaved={() => {
            setTab("tests");
            loadTests();
          }}
          onCancel={() => setTab("tests")}
        />
      </div>
    );
  }

  // ===== Results tab =====
  if (tab === "results") {
    const test = tests.find((x) => x.id === resultsTestId);
    return (
      <div className="px-4 py-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-2xl font-extrabold text-purple-900">
            📊 {t("resultsFor")} {test?.emoji} {test?.title}
          </h2>
          <div className="flex gap-2">
            {test && (
              <Button
                onClick={() => {
                  setEditingId(test.id);
                  setTab("editor");
                }}
                variant="outline"
                className="rounded-full border-2 border-purple-200 font-bold"
              >
                ✏️ {t("edit")}
              </Button>
            )}
            <Button
              onClick={() => setTab("tests")}
              variant="ghost"
              className="rounded-full font-bold text-purple-500"
            >
              {t("backHome")}
            </Button>
          </div>
        </div>
        <AttemptsTable
          attempts={attempts}
          loading={attemptsLoading}
          exportTestId={resultsTestId ?? "all"}
          hideInstructorPhone={siteSettings?.hideInstructorStudentPhone !== "false"}
          onRefresh={() => {
            if (resultsTestId) loadResults(resultsTestId);
          }}
        />
      </div>
    );
  }

  // ===== Tests tab =====
  return (
    <div className="px-4 py-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">
            👩‍🏫 {t("instructorPanel")}
          </h1>
          <p className="text-purple-500 font-semibold text-sm mt-1">
            {userName} — {t("myTests")}
          </p>
        </div>
        <Button
          onClick={() => {
            playClick();
            setEditingId(null);
            setTab("editor");
          }}
          className="btn-fun bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white text-lg px-7 py-4 h-auto"
          style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
        >
          {t("newTest")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-400" />
        </div>
      ) : tests.length === 0 ? (
        <div className="card-fun p-10 text-center text-purple-400 font-bold">
          {t("noAttempts")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test, i) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-fun p-5"
              style={{ borderColor: test.color + "44" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: test.color + "22" }}
                >
                  {test.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-purple-900 truncate">{test.title}</h3>
                    {test.isSystem && (
                      <span className="text-[10px] bg-cyan-100 text-cyan-700 border border-cyan-300 rounded-full px-2 py-0.5 font-bold">
                        🔒 {t("system")}
                      </span>
                    )}
                    <button
                      onClick={() => togglePublish(test)}
                      className={`text-[10px] rounded-full px-2 py-0.5 font-bold border ${
                        test.isPublished
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-gray-100 text-gray-500 border-gray-300"
                      }`}
                    >
                      {test.isPublished ? `👁️ ${t("published")}` : `纸张 ${t("draft")}`}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] font-bold text-purple-500">
                    <span>📋 {test.questionCount} {t("questionsCount")}</span>
                    <span>👥 {test.attemptsCount} {t("studentsCount")}</span>
                    <span className="uppercase">{test.language}</span>
                    <span dir="ltr" className="text-purple-300">/?t={test.slug}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <button
                  onClick={() => copyLink(test.slug)}
                  className="rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs py-2.5"
                >
                  🔗 {t("copyLink")}
                </button>
                <button
                  onClick={() => window.open(`/?t=${test.slug}`, "_blank")}
                  className="rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs py-2.5"
                >
                  👁️ {t("openTest")}
                </button>
                <button
                  onClick={() => openResults(test.id)}
                  className="rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold text-xs py-2.5"
                >
                  📊 {t("results")}
                </button>
                <button
                  onClick={() => {
                    setEditingId(test.id);
                    setTab("editor");
                  }}
                  className="rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold text-xs py-2.5"
                >
                  ✏️ {t("edit")}
                </button>
              </div>
              <button
                onClick={() => deleteTest(test)}
                disabled={test.isSystem}
                className="mt-2 w-full rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-500 font-bold text-xs py-2"
              >
                🗑️ {t("delete")}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
