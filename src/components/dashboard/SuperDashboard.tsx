"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import TestEditor from "./TestEditor";
import AttemptsTable from "./AttemptsTable";
import type { AttemptRow } from "@/lib/shared-types";

interface UserRow {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  testsCount: number;
}

interface AllTest {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  color: string;
  kind: string;
  language: string;
  isSystem: boolean;
  isPublished: boolean;
  ownerName: string;
  questionCount: number;
  attemptsCount: number;
}

type Tab = "overview" | "instructors" | "tests" | "results" | "editor";

export default function SuperDashboard({ userName }: { userName: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tests, setTests] = useState<AllTest[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // instructor form
  const [instName, setInstName] = useState("");
  const [instUsername, setInstUsername] = useState("");
  const [instPassword, setInstPassword] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, tt, a] = await Promise.all([
        fetch("/api/instructors", { cache: "no-store" }),
        fetch("/api/tests", { cache: "no-store" }),
        fetch("/api/attempts", { cache: "no-store" }),
      ]);
      if (u.ok) setUsers(await u.json());
      if (tt.ok) setTests(await tt.json());
      if (a.ok) setAttempts(await a.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addInstructor = async () => {
    if (!instName.trim() || !instUsername.trim() || !instPassword.trim()) {
      toast({ title: "أكمل جميع الحقول", variant: "destructive" });
      return;
    }
    const res = await fetch("/api/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: instName.trim(),
        username: instUsername.trim(),
        password: instPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg =
        data.error === "exists"
          ? "اسم المستخدم موجود مسبقاً"
          : data.error === "weak"
          ? "اسم المستخدم 3+ أحرف وكلمة المرور 5+ خانات"
          : t("errorGeneric");
      toast({ title: msg, variant: "destructive" });
      return;
    }
    toast({ title: `✅ تم إنشاء حساب ${instName.trim()}` });
    setInstName("");
    setInstUsername("");
    setInstPassword("");
    loadAll();
  };

  const toggleUser = async (u: UserRow) => {
    const res = await fetch(`/api/instructors/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) loadAll();
  };

  const resetPassword = async (u: UserRow) => {
    const pw = prompt(`كلمة مرور جديدة لـ ${u.name}:`);
    if (!pw) return;
    const res = await fetch(`/api/instructors/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    toast({
      title: res.ok ? "✅ تم تغيير كلمة المرور" : "كلمة المرور 5+ خانات",
      variant: res.ok ? undefined : "destructive",
    });
  };

  const deleteUser = async (u: UserRow) => {
    if (!confirm(`${t("deleteConfirm")}\n${u.name}`)) return;
    const res = await fetch(`/api/instructors/${u.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    toast({
      title: res.ok ? "🗑️ تم الحذف" : data.error === "locked" ? "لا يمكن حذف حساب سوبر أدمن" : t("errorGeneric"),
      variant: res.ok ? undefined : "destructive",
    });
    if (res.ok) loadAll();
  };

  const togglePublish = async (test: AllTest) => {
    const res = await fetch(`/api/tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !test.isPublished }),
    });
    if (res.ok) {
      toast({ title: test.isPublished ? t("unpublish") : t("published") });
      loadAll();
    }
  };

  const deleteTest = async (test: AllTest) => {
    if (test.isSystem) {
      toast({ title: t("systemLockedNote"), variant: "destructive" });
      return;
    }
    if (!confirm(`${t("confirmDelete")}\n${test.title}`)) return;
    const res = await fetch(`/api/tests/${test.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "🗑️ تم الحذف" });
      loadAll();
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/?t=${slug}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast({ title: t("copied"), description: url }))
      .catch(() => toast({ title: url }));
  };

  if (tab === "editor") {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto w-full">
        <TestEditor
          testId={editingId}
          onSaved={() => {
            setTab("tests");
            loadAll();
          }}
          onCancel={() => setTab("tests")}
        />
      </div>
    );
  }

  const interviews = attempts.filter((a) => a.wantsInterview).length;
  const students = new Set(attempts.map((a) => a.phone)).size;

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-purple-900">
          👑 {t("superPanel")}
        </h1>
        <p className="text-purple-500 font-semibold text-sm mt-1">
          {userName} — تحكم كامل بالمحاضرين والاختبارات والنتائج
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ["overview", `📈 ${t("statsOverview")}`],
            ["instructors", t("instructors")],
            ["tests", t("allTests")],
            ["results", t("allResults")],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-5 py-2.5 font-bold text-sm border-2 transition-all ${
              tab === key
                ? "bg-purple-600 border-purple-700 text-white shadow"
                : "bg-white border-purple-200 text-purple-600 hover:bg-purple-50"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => {
            setEditingId(null);
            setTab("editor");
          }}
          className="rounded-full px-5 py-2.5 font-bold text-sm border-2 bg-gradient-to-l from-purple-600 to-fuchsia-500 border-purple-700 text-white shadow hover:scale-105 transition-transform"
        >
          {t("newTest")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-400" />
        </div>
      ) : (
        <>
          {/* ===== Overview ===== */}
          {tab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t("usersCount"), value: users.length, emoji: "🧑‍🏫", bg: "bg-purple-100" },
                  { label: t("testsCount"), value: tests.length, emoji: "🧩", bg: "bg-amber-100" },
                  { label: "طلبة فريدون", value: students, emoji: "🧑‍🎓", bg: "bg-orange-100" },
                  { label: t("interviewReq"), value: interviews, emoji: "🎥", bg: "bg-teal-100" },
                ].map((s, i) => (
                  <div key={i} className={`card-fun p-5 ${s.bg} bg-opacity-60`}>
                    <div className="text-3xl mb-1">{s.emoji}</div>
                    <div className="text-3xl font-extrabold text-purple-900">{s.value}</div>
                    <div className="text-sm text-purple-600 font-bold">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="card-fun p-5">
                <h3 className="font-extrabold text-purple-900 mb-3">
                  🔑 الحسابات الجاهزة (غيّر كلمات المرور فوراً)
                </h3>
                <div className="space-y-2 text-sm font-semibold text-purple-700" dir="ltr">
                  <p>👑 super / super2026 — Super Admin (كل الصلاحيات)</p>
                  <p>👩‍🏫 duaa / duaa2026 — الدكتورة دعاء (محاضرة)</p>
                  <p>👨‍🏫 ridha / ridha2026 — أ. رضاء البيساني (محاضر)</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== Instructors ===== */}
          {tab === "instructors" && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="card-fun p-5">
                <h3 className="font-extrabold text-purple-900 mb-4">{t("addInstructor")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">{t("instName")}</Label>
                    <Input value={instName} onChange={(e) => setInstName(e.target.value)} className="h-11 rounded-2xl border-2 border-purple-200" placeholder="أ. محمد أحمد" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">{t("instUsername")}</Label>
                    <Input value={instUsername} onChange={(e) => setInstUsername(e.target.value)} dir="ltr" className="h-11 rounded-2xl border-2 border-purple-200 text-left" placeholder="mohammed" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">{t("instPassword")}</Label>
                    <Input value={instPassword} onChange={(e) => setInstPassword(e.target.value)} dir="ltr" className="h-11 rounded-2xl border-2 border-purple-200 text-left" placeholder="••••••" />
                  </div>
                  <Button
                    onClick={addInstructor}
                    className="btn-fun bg-gradient-to-l from-emerald-500 to-teal-500 text-white h-11"
                    style={{ ["--btn-fun-shadow" as string]: "#0f766e" }}
                  >
                    {t("create")}
                  </Button>
                </div>
              </div>

              <div className="card-fun p-2 sm:p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-purple-50">
                    <tr className="text-purple-900">
                      <th className="p-3 text-right font-extrabold">{t("instName")}</th>
                      <th className="p-3 text-right font-extrabold">{t("instUsername")}</th>
                      <th className="p-3 text-right font-extrabold">{t("testsCount")}</th>
                      <th className="p-3 text-right font-extrabold">{t("active")}</th>
                      <th className="p-3 text-right font-extrabold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-purple-50 hover:bg-purple-50/50">
                        <td className="p-3 font-bold text-purple-900">
                          {u.role === "super" ? "👑" : "👩‍🏫"} {u.name}
                        </td>
                        <td className="p-3 font-semibold text-purple-600" dir="ltr">
                          {u.username}
                        </td>
                        <td className="p-3 font-bold text-purple-700">{u.testsCount}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              u.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {u.isActive ? t("active") : t("inactive")}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {u.role !== "super" && (
                              <>
                                <button
                                  onClick={() => toggleUser(u)}
                                  className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs px-2.5 py-1.5"
                                >
                                  {u.isActive ? `⏸️ ${t("suspend")}` : `▶️ ${t("activate")}`}
                                </button>
                                <button
                                  onClick={() => resetPassword(u)}
                                  className="rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs px-2.5 py-1.5"
                                >
                                  🔑 {t("resetPw")}
                                </button>
                                <button
                                  onClick={() => deleteUser(u)}
                                  className="rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs px-2.5 py-1.5"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                            {u.role === "super" && (
                              <span className="text-purple-300 text-xs font-bold">حماية كاملة</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ===== All tests ===== */}
          {tab === "tests" && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {tests.map((test) => (
                <div key={test.id} className="card-fun p-5" style={{ borderColor: test.color + "44" }}>
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
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] font-bold text-purple-500">
                        <span>👩‍🏫 {test.ownerName}</span>
                        <span>📋 {test.questionCount}</span>
                        <span>👥 {test.attemptsCount}</span>
                        <span className="uppercase">{test.language}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    <button onClick={() => copyLink(test.slug)} className="rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs py-2.5">
                      🔗 {t("copyLink")}
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
                    <button onClick={() => togglePublish(test)} className="rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs py-2.5">
                      {test.isPublished ? `纸张 ${t("unpublish")}` : `👁️ ${t("publish")}`}
                    </button>
                    <button
                      onClick={() => deleteTest(test)}
                      disabled={test.isSystem}
                      className="rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-500 font-bold text-xs py-2.5"
                    >
                      🗑️ {t("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ===== All results ===== */}
          {tab === "results" && (
            <AttemptsTable attempts={attempts} loading={false} showTest exportTestId="all" onRefresh={loadAll} />
          )}
        </>
      )}
    </div>
  );
}
