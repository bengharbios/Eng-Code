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

type Tab = "overview" | "instructors" | "permissions" | "tests" | "results" | "students" | "homepage" | "editor";

export default function SuperDashboard({ userName }: { userName: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tests, setTests] = useState<AllTest[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Site settings state
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({
    siteName: "مغامرة المستوى",
    instituteName: "معهد السلام التثقافي",
    contactPhone: "042899688",
    welcomeMessage: "",
    footerText: "",
    heroTitle: "",
    heroSubtitle: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Permissions editing
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [permsMap, setPermsMap] = useState<Record<string, any>>({});

  // instructor form
  const [instName, setInstName] = useState("");
  const [instUsername, setInstUsername] = useState("");
  const [instPassword, setInstPassword] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, tt, a, s, cfg] = await Promise.all([
        fetch("/api/instructors", { cache: "no-store" }),
        fetch("/api/tests", { cache: "no-store" }),
        fetch("/api/attempts", { cache: "no-store" }),
        fetch("/api/admin/students", { cache: "no-store" }),
        fetch("/api/admin/settings", { cache: "no-store" }),
      ]);
      if (u.ok) {
        const uData = await u.json();
        setUsers(uData);
        // Build permissions map
        const pm: Record<string, any> = {};
        for (const usr of uData) {
          try { pm[usr.id] = JSON.parse(usr.permissionsJson || "{}"); } catch { pm[usr.id] = {}; }
        }
        setPermsMap(pm);
      }
      if (tt.ok) setTests(await tt.json());
      if (a.ok) setAttempts(await a.json());
      if (s.ok) setStudents(await s.json());
      if (cfg.ok) {
        const cfgData = await cfg.json();
        setSiteSettings(prev => ({ ...prev, ...cfgData }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addInstructor = async () => {
    if (!instName.trim() || !instUsername.trim() || !instPassword.trim()) {
      toast({ title: t("fillAllFields"), variant: "destructive" });
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
    toast({ title: `✅ ${t("accountCreatedOk")}: ${instName.trim()}` });
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
      title: res.ok ? t("deletedOk") : data.error === "locked" ? "لا يمكن حذف حساب سوبر أدمن" : t("errorGeneric"),
      variant: res.ok ? undefined : "destructive",
    });
    if (res.ok) loadAll();
  };

  const promoteToInstructor = async (s: StudentItem) => {
    if (!confirm(`${t("confirmPromote")}\n(${s.name})`)) return;
    try {
      const res = await fetch(`/api/admin/students/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "instructor" }),
      });
      if (res.ok) {
        toast({ title: t("promotedOk"), description: s.name });
        loadAll();
      } else {
        toast({ title: t("promoteFailed"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("serverError"), variant: "destructive" });
    }
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
      toast({ title: t("deletedOk") });
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

  const resetStudentPassword = async (s: any) => {
    if (!confirm(`${t("confirmResetPw")}\n(${s.name})`)) return;
    const res = await fetch(`/api/admin/students/${s.id}`, { method: "PATCH" });
    if (res.ok) {
      toast({ title: `${t("passwordResetOk")}: ${s.name}` });
      loadAll();
    } else {
      toast({ title: t("errorGeneric"), variant: "destructive" });
    }
  };

  const deleteStudent = async (s: any) => {
    if (!confirm(`${t("confirmDeleteStudent")}\n(${s.name})`)) return;
    const res = await fetch(`/api/admin/students/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: `${t("deletedOk")}: ${s.name}` });
      loadAll();
    } else {
      toast({ title: t("errorGeneric"), variant: "destructive" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("imgSizeLimit"), variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        setSiteSettings(prev => ({ ...prev, [key]: base64 }));
        toast({ title: t("imgSelectedOk") });
      }
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteSettings),
      });
      if (res.ok) toast({ title: t("settingsSaved") });
      else toast({ title: t("errorGeneric"), variant: "destructive" });
    } finally {
      setSettingsSaving(false);
    }
  };

  const savePermissions = async (userId: string) => {
    const perms = permsMap[userId] || {};
    const res = await fetch(`/api/admin/permissions/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perms),
    });
    if (res.ok) {
      toast({ title: t("permsSaved") });
      setEditingPerms(null);
    } else {
      toast({ title: t("errorGeneric"), variant: "destructive" });
    }
  };

  const togglePerm = (userId: string, key: string, value: boolean) => {
    setPermsMap(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [key]: value }
    }));
  };

  const interviews = attempts.filter((a) => a.wantsInterview).length;
  const uniqueStudents = new Set(attempts.map((a) => a.phone)).size;

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
          ["permissions", `🔐 الصلاحيات`],
          ["tests", t("allTests")],
          ["results", t("allResults")],
          ["students", `👥 الطلبة`],
          ["homepage", `🖥️ الصفحة الرئيسية`],
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
                  { label: "طلبة فريدون", value: uniqueStudents, emoji: "🧑‍🎓", bg: "bg-orange-100" },
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
            <AttemptsTable
              attempts={attempts}
              loading={false}
              showTest
              exportTestId="all"
              onRefresh={loadAll}
              hideInstructorPhone={siteSettings?.hideInstructorStudentPhone === "true"}
            />
          )}

          {/* ===== Students ===== */}
          {tab === "students" && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-purple-900">👥 إدارة حسابات الطلبة</h2>
                <span className="text-sm font-bold text-purple-500 bg-purple-100 px-3 py-1 rounded-full">
                  {students.length} طالب
                </span>
              </div>

              <div className="card-fun p-2 sm:p-4 overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-purple-50 z-10">
                      <tr className="text-purple-900">
                        <th className="p-3 text-right font-extrabold">الاسم</th>
                        <th className="p-3 text-right font-extrabold">الهاتف</th>
                        <th className="p-3 text-right font-extrabold">العمر</th>
                        <th className="p-3 text-right font-extrabold">الدولة</th>
                        <th className="p-3 text-right font-extrabold">المحاولات</th>
                        <th className="p-3 text-right font-extrabold">كلمة المرور</th>
                        <th className="p-3 text-right font-extrabold">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-purple-400 font-bold">لا يوجد طلبة</td>
                        </tr>
                      ) : (
                        students.map((s) => (
                          <tr key={s.id} className="border-t border-purple-50 hover:bg-purple-50/50">
                            <td className="p-3 font-bold text-purple-900">{s.name}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5" dir="ltr">
                                <a href={`tel:${s.phone}`} className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-sm">📞</a>
                                <a href={`https://wa.me/${s.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-sm">💬</a>
                                <span className="font-semibold text-purple-700 text-xs whitespace-nowrap">{s.phone}</span>
                              </div>
                            </td>
                            <td className="p-3 text-purple-700 font-semibold">{s.age || "—"}</td>
                            <td className="p-3 text-purple-700 font-semibold">{s.country || "—"}</td>
                            <td className="p-3 text-center">
                              <span className="bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full text-xs">{s.attemptsCount}</span>
                            </td>
                            <td className="p-3 text-center">
                              {s.hasPassword ? (
                                <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-xs">✅ مُعيَّنة</span>
                              ) : (
                                <span className="bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full text-xs">⚠️ لا يوجد</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1.5 flex-wrap">
                                <button
                                  onClick={() => promoteToInstructor(s)}
                                  className="rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs px-2.5 py-1.5 whitespace-nowrap"
                                >
                                  🎓 ترقية إلى محاضر
                                </button>
                                {s.hasPassword && (
                                  <button
                                    onClick={() => resetStudentPassword(s)}
                                    className="rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs px-2.5 py-1.5 whitespace-nowrap"
                                  >
                                    🔑 مسح كلمة المرور
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteStudent(s)}
                                  className="rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs px-2.5 py-1.5"
                                >
                                  🗑️ حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== Permissions ===== */}
          {tab === "permissions" && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-purple-900">🔐 صلاحيات المحاضرين</h2>
              </div>

              <div className="space-y-3">
                {users.filter(u => u.role !== "super").map((u) => {
                  const perms = permsMap[u.id] || {};
                  const isEditing = editingPerms === u.id;
                  return (
                    <div key={u.id} className="card-fun p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="font-extrabold text-purple-900 text-base">👩‍🏫 {u.name}</span>
                          <span className="text-purple-400 text-sm font-semibold mr-2" dir="ltr">@{u.username}</span>
                        </div>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => savePermissions(u.id)}
                                className="rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs px-3 py-1.5"
                              >
                                ✅ حفظ
                              </button>
                              <button
                                onClick={() => setEditingPerms(null)}
                                className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs px-3 py-1.5"
                              >
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEditingPerms(u.id)}
                              className="rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs px-3 py-1.5"
                            >
                              ✏️ تعديل الصلاحيات
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: "canCreateTests", label: "إنشاء اختبارات جديدة", icon: "➕" },
                          { key: "canExport", label: "تصدير النتائج Excel", icon: "📊" },
                          { key: "canViewAllResults", label: "رؤية نتائج الكل", icon: "👁️" },
                          { key: "canManageStudents", label: "إدارة بيانات الطلبة", icon: "👥" },
                          { key: "canEditSystemTests", label: "تعديل الاختبارات النظامية", icon: "🔒" },
                        ].map(({ key, label, icon }) => {
                          const val = perms[key] !== false; // default true
                          return (
                            <label
                              key={key}
                              className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                val ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50/50"
                              } ${!isEditing ? "cursor-default opacity-80" : ""}`}
                            >
                              <span className="text-xl">{icon}</span>
                              <span className="flex-1 font-bold text-sm text-purple-900">{label}</span>
                              <div
                                onClick={() => isEditing && togglePerm(u.id, key, !val)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${
                                  val ? "bg-emerald-400" : "bg-gray-300"
                                } ${isEditing ? "cursor-pointer" : "cursor-default"}`}
                              >
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                                  val ? "right-0.5" : "left-0.5"
                                }`} />
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {isEditing && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-sm text-amber-800 font-semibold">
                          <span>⚠️</span>
                          <span>الإعدادات تُطبَّق فوراً عند الحفظ. يحتاج المحاضر لتسجيل خروج وإعادة دخول لرؤية التغييرات.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {users.filter(u => u.role !== "super").length === 0 && (
                  <div className="card-fun p-10 text-center text-purple-400 font-bold">
                    لا يوجد محاضرون حتى الآن — أضف محاضرين أولاً من تبويب "المحاضرين"
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== Homepage Control ===== */}
          {tab === "homepage" && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-purple-900">🖥️ التحكم الشامل بالصفحة الرئيسية والـ Footer</h2>
                <button
                  onClick={saveSettings}
                  disabled={settingsSaving}
                  className="btn-fun bg-gradient-to-l from-emerald-500 to-teal-500 text-white font-bold text-sm px-6 py-2.5 rounded-2xl"
                  style={{ ["--btn-fun-shadow" as string]: "#0f766e" }}
                >
                  {settingsSaving ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
                </button>
              </div>

              {/* Identity & Logos */}
              <div className="card-fun p-5 space-y-4">
                <h3 className="font-extrabold text-purple-900 text-base border-b border-purple-100 pb-2 flex items-center justify-between">
                  <span>🏷️ هوية المنصة والشعارات</span>
                  <span className="text-xs text-purple-500 font-normal">الشعار والتميمة والأسماء الرئيسية</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">اسم المنصة (الرئيسي)</Label>
                    <Input
                      value={siteSettings.siteName || ""}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, siteName: e.target.value }))}
                      className="h-11 rounded-2xl border-2 border-purple-200"
                      placeholder="مغامرة المستوى"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">اسم المعهد</Label>
                    <Input
                      value={siteSettings.instituteName || ""}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, instituteName: e.target.value }))}
                      className="h-11 rounded-2xl border-2 border-purple-200"
                      placeholder="معهد السلام الثقافي"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">رقم التواصل الأكاديمي</Label>
                    <Input
                      value={siteSettings.contactPhone || ""}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="h-11 rounded-2xl border-2 border-purple-200"
                      dir="ltr"
                      placeholder="042899688"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-purple-50">
                  {/* Logo Upload */}
                  <div className="space-y-2 card-fun p-4 bg-purple-50/50 !border-purple-100">
                    <Label className="font-bold text-purple-900 text-sm block">🖼️ شعار المعهد / المنصة (Header Logo)</Label>
                    <div className="flex items-center gap-3">
                      {siteSettings.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={siteSettings.logoUrl} alt="الشعار الحالي" className="w-12 h-12 object-contain rounded-lg border bg-white p-1" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg border bg-white flex items-center justify-center text-xl">🎓</div>
                      )}
                      <div className="flex-1 space-y-1">
                        <label className="btn-fun bg-purple-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer inline-block">
                          📤 رفع شعار جديد
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "logoUrl")} />
                        </label>
                        {siteSettings.logoUrl && (
                          <button onClick={() => setSiteSettings(prev => ({ ...prev, logoUrl: "" }))} className="text-xs text-rose-600 underline block font-bold">
                            إزالة الشعار المخصص
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mascot Upload */}
                  <div className="space-y-2 card-fun p-4 bg-purple-50/50 !border-purple-100">
                    <Label className="font-bold text-purple-900 text-sm block">🎨 صورة التميمة الرسمية للمنصة (Hero Mascot)</Label>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={siteSettings.mascotUrl || "/images/mascot-welcome.png"} alt="التميمة" className="w-12 h-12 object-contain rounded-lg border bg-white p-1" />
                      <div className="flex-1 space-y-1">
                        <label className="btn-fun bg-purple-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer inline-block">
                          📤 تغيير صورة التميمة
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "mascotUrl")} />
                        </label>
                        {siteSettings.mascotUrl && (
                          <button onClick={() => setSiteSettings(prev => ({ ...prev, mascotUrl: "" }))} className="text-xs text-rose-600 underline block font-bold">
                            استعادة الصورة الافتراضية
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Banner */}
              <div className="card-fun p-5 space-y-4">
                <h3 className="font-extrabold text-purple-900 text-base border-b border-purple-100 pb-2">🦸 البانر الرئيسي والعناوين</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">العنوان الرئيسي (فوق الصفحة)</Label>
                    <Input
                      value={siteSettings.heroTitle || ""}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, heroTitle: e.target.value }))}
                      className="h-11 rounded-2xl border-2 border-purple-200"
                      placeholder="مغامرة المستوى"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">العنوان الفرعي الوصفي</Label>
                    <Input
                      value={siteSettings.heroSubtitle || ""}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                      className="h-11 rounded-2xl border-2 border-purple-200"
                      placeholder="منصة الاختبارات التعليمية التفاعلية — معهد السلام الثقافي"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-purple-800 text-sm">📢 إعلان / شريط ترحيبي علوي (اختياري)</Label>
                    <textarea
                      value={siteSettings.welcomeMessage || ""}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                      className="w-full h-20 rounded-2xl border-2 border-purple-200 p-3 text-sm font-semibold text-purple-900 focus:outline-none focus:border-purple-400 resize-none"
                      placeholder="🎉 مرحباً بكم! افتتحنا قسم الاختبارات الجديدة لهذا الموسم..."
                    />
                  </div>
                </div>
              </div>

              {/* Accreditation Section Control */}
              <div className="card-fun p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h3 className="font-extrabold text-purple-900 text-base">🛡️ قسم الاعتماد العلمي والأكاديمي</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-purple-700">إظهار القسم</span>
                    <input
                      type="checkbox"
                      checked={siteSettings.showAccreditation !== "false"}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, showAccreditation: e.target.checked ? "true" : "false" }))}
                      className="w-4 h-4 rounded text-purple-600"
                    />
                  </label>
                </div>
                {siteSettings.showAccreditation !== "false" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-bold text-purple-800 text-sm">عنوان الاعتماد</Label>
                        <Input
                          value={siteSettings.accreditationTitle || ""}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, accreditationTitle: e.target.value }))}
                          className="h-11 rounded-2xl border-2 border-purple-200"
                          placeholder="الاعتماد العلمي والأكاديمي"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-purple-800 text-sm">شعار قسم الاعتماد</Label>
                        <label className="btn-fun bg-cyan-600 text-white font-bold text-xs px-3 py-2.5 rounded-xl cursor-pointer block text-center">
                          📤 رفع شعار الاعتماد
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "accreditationLogoUrl")} />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-purple-800 text-sm">وصف الاعتماد العلمي</Label>
                      <Input
                        value={siteSettings.accreditationDesc || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, accreditationDesc: e.target.value }))}
                        className="h-11 rounded-2xl border-2 border-purple-200"
                        placeholder="مبني على الإطار الأوروبي CEFR ودليل تشخيصي معتمد"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-purple-800 text-sm">صاحب الاعتماد / اسم المؤسسة الشريكة</Label>
                      <Input
                        value={siteSettings.accreditationAuthor || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, accreditationAuthor: e.target.value }))}
                        className="h-11 rounded-2xl border-2 border-purple-200"
                        placeholder="أ. رضاء البيساني — مؤسسة قيادة التعلم المرح (LFL) × معهد السلام الثقافي"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Features Section Control */}
              <div className="card-fun p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h3 className="font-extrabold text-purple-900 text-base">🎯 قسم مميزات المنصة (الكروت الثلاثة)</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-purple-700">إظهار قسم المميزات</span>
                    <input
                      type="checkbox"
                      checked={siteSettings.showFeatures !== "false"}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, showFeatures: e.target.checked ? "true" : "false" }))}
                      className="w-4 h-4 rounded text-purple-600"
                    />
                  </label>
                </div>

                {siteSettings.showFeatures !== "false" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Feature 1 */}
                    <div className="space-y-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <h4 className="font-bold text-xs text-amber-900">الكارت الأول</h4>
                      <Input
                        value={siteSettings.feature1Emoji || "🎯"}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature1Emoji: e.target.value }))}
                        className="h-9 rounded-xl border border-amber-300 text-center font-bold"
                        placeholder="🎯"
                      />
                      <Input
                        value={siteSettings.feature1Title || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature1Title: e.target.value }))}
                        className="h-9 rounded-xl border border-amber-300 font-bold text-xs"
                        placeholder="اختبارات تفاعلية"
                      />
                      <textarea
                        value={siteSettings.feature1Desc || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature1Desc: e.target.value }))}
                        className="w-full h-16 rounded-xl border border-amber-300 p-2 text-xs font-medium resize-none"
                        placeholder="أسئلة مصوّرة وممتعة بتصميم يشبه الألعاب"
                      />
                    </div>

                    {/* Feature 2 */}
                    <div className="space-y-2 p-3 bg-pink-50 rounded-xl border border-pink-200">
                      <h4 className="font-bold text-xs text-pink-900">الكارت الثاني</h4>
                      <Input
                        value={siteSettings.feature2Emoji || "⚡"}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature2Emoji: e.target.value }))}
                        className="h-9 rounded-xl border border-pink-300 text-center font-bold"
                        placeholder="⚡"
                      />
                      <Input
                        value={siteSettings.feature2Title || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature2Title: e.target.value }))}
                        className="h-9 rounded-xl border border-pink-300 font-bold text-xs"
                        placeholder="نتيجة فورية"
                      />
                      <textarea
                        value={siteSettings.feature2Desc || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature2Desc: e.target.value }))}
                        className="w-full h-16 rounded-xl border border-pink-300 p-2 text-xs font-medium resize-none"
                        placeholder="مستواك يُحدد لحظياً وفق معايير علمية معتمدة"
                      />
                    </div>

                    {/* Feature 3 */}
                    <div className="space-y-2 p-3 bg-teal-50 rounded-xl border border-teal-200">
                      <h4 className="font-bold text-xs text-teal-900">الكارت الثالث</h4>
                      <Input
                        value={siteSettings.feature3Emoji || "🛡️"}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature3Emoji: e.target.value }))}
                        className="h-9 rounded-xl border border-teal-300 text-center font-bold"
                        placeholder="🛡️"
                      />
                      <Input
                        value={siteSettings.feature3Title || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature3Title: e.target.value }))}
                        className="h-9 rounded-xl border border-teal-300 font-bold text-xs"
                        placeholder="اعتماد علمي"
                      />
                      <textarea
                        value={siteSettings.feature3Desc || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, feature3Desc: e.target.value }))}
                        className="w-full h-16 rounded-xl border border-teal-300 p-2 text-xs font-medium resize-none"
                        placeholder="مبني على الإطار الأوروبي CEFR ودليل تشخيصي معتمد"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Zoom Interview & Result Page Control */}
              <div className="card-fun p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h3 className="font-extrabold text-purple-900 text-base">🎥 التحكم بقسم مقابلة Zoom ونصوص نتيجة الاختبار</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-purple-700">إظهار قسم Zoom</span>
                    <input
                      type="checkbox"
                      checked={siteSettings.showZoomSection !== "false"}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, showZoomSection: e.target.checked ? "true" : "false" }))}
                      className="w-4 h-4 rounded text-purple-600"
                    />
                  </label>
                </div>

                {siteSettings.showZoomSection !== "false" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-purple-800 text-sm">عنوان صندوق مقابلة Zoom</Label>
                      <Input
                        value={siteSettings.zoomTitle || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, zoomTitle: e.target.value }))}
                        className="h-11 rounded-2xl border-2 border-purple-200"
                        placeholder="هل تريد تحديد مستواك بدقة أكبر؟"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-purple-800 text-sm">وصف مقابلة Zoom</Label>
                      <textarea
                        value={siteSettings.zoomDesc || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, zoomDesc: e.target.value }))}
                        className="w-full h-20 rounded-2xl border-2 border-purple-200 p-3 text-sm font-semibold text-purple-900 focus:outline-none focus:border-purple-400 resize-none"
                        placeholder="يمكنك التقديم على مقابلة شخصية عبر Zoom لتقييم محاورتك وتحديد مستواك بشكل أدق."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-purple-800 text-sm">عنوان رسالة تأكيد تسجيل المقابلة</Label>
                      <Input
                        value={siteSettings.zoomBookedTitle || ""}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, zoomBookedTitle: e.target.value }))}
                        className="h-11 rounded-2xl border-2 border-purple-200"
                        placeholder="🎊 تم تسجيل رغبتك في المقابلة! الخطوة التالية:"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-bold text-purple-800 text-sm">الخطوة الأولى (1️⃣)</Label>
                        <textarea
                          value={siteSettings.zoomStep1 || ""}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, zoomStep1: e.target.value }))}
                          className="w-full h-20 rounded-2xl border-2 border-purple-200 p-3 text-sm font-semibold text-purple-900 focus:outline-none focus:border-purple-400 resize-none"
                          placeholder="1️⃣ اطلب ذلك من الدكتورة دعاء مباشرة في الويبينار الآن."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-purple-800 text-sm">الخطوة الثانية (2️⃣)</Label>
                        <textarea
                          value={siteSettings.zoomStep2 || ""}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, zoomStep2: e.target.value }))}
                          className="w-full h-20 rounded-2xl border-2 border-purple-200 p-3 text-sm font-semibold text-purple-900 focus:outline-none focus:border-purple-400 resize-none"
                          placeholder="2️⃣ أو تواصل مع الفريق الأكاديمي:"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-bold text-purple-800 text-sm">📞 رقم الهاتف للاتصال المباشر</Label>
                        <Input
                          value={siteSettings.contactPhone || ""}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                          className="h-11 rounded-2xl border-2 border-purple-200"
                          placeholder="042899688"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-purple-800 text-sm">💬 رقم الواتساب الدولي (بدون +)</Label>
                        <Input
                          value={siteSettings.whatsappPhone || ""}
                          onChange={(e) => setSiteSettings(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                          className="h-11 rounded-2xl border-2 border-purple-200"
                          placeholder="97142899688"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy section */}
              <div className="card-fun p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <div>
                    <h3 className="font-extrabold text-purple-900 text-base">🔒 حماية بيانات العملاء (أرقام تواصل الطلاب)</h3>
                    <p className="text-xs text-purple-500 font-semibold mt-0.5">عند تفعيل هذا الخيار، سيتم تشفير وإخفاء أرقام هواتف الطلاب عن المحاضرين لمنع حفظها أو التواصل المباشر خارج المنصة.</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl shrink-0">
                    <span className="text-xs font-black text-purple-900">إخفاء الأرقام عن المحاضرين</span>
                    <input
                      type="checkbox"
                      checked={siteSettings.hideInstructorStudentPhone !== "false"}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, hideInstructorStudentPhone: e.target.checked ? "true" : "false" }))}
                      className="w-4.5 h-4.5 rounded text-purple-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Footer text */}
              <div className="card-fun p-5 space-y-4">
                <h3 className="font-extrabold text-purple-900 text-base border-b border-purple-100 pb-2">🦶 أسفل الصفحة (Footer)</h3>
                <div className="space-y-1.5">
                  <Label className="font-bold text-purple-800 text-sm">نص الحقوق والختام</Label>
                  <Input
                    value={siteSettings.footerText || ""}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, footerText: e.target.value }))}
                    className="h-11 rounded-2xl border-2 border-purple-200"
                    placeholder="جميع الحقوق محفوظة © 2025"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800 font-semibold flex gap-2">
                <span>💡</span>
                <span>عند النقر على "💾 حفظ التغييرات"، تُطبَّق كافة التعديلات مباشرة على كافة صفحات المنصة.</span>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
