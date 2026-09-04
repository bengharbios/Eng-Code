"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { AttemptRow } from "@/lib/shared-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const LEVEL_COLORS: Record<string, string> = {
  A1: "#22c55e", A2: "#14b8a6", B1: "#f59e0b", B2: "#f97316", C1: "#8b5cf6",
  EXC: "#f59e0b", VGOOD: "#14b8a6", GOOD: "#f97316", REVIEW: "#8b5cf6",
};

export default function AttemptsTable({
  attempts,
  loading,
  showTest = false,
  exportTestId = "all",
  emptyNote,
  onRefresh,
}: {
  attempts: AttemptRow[];
  loading: boolean;
  showTest?: boolean;
  exportTestId?: string;
  emptyNote?: string;
  onRefresh?: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [localAttempts, setLocalAttempts] = useState<AttemptRow[]>(attempts);
  const [viewAttempt, setViewAttempt] = useState<any>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(false);

  // Sync local state when parent refreshes data
  useMemo(() => { setLocalAttempts(attempts); }, [attempts]);

  const stats = useMemo(() => {
    if (localAttempts.length === 0) return null;
    const avg = Math.round(
      localAttempts.reduce((a, x) => a + x.percentage, 0) / localAttempts.length
    );
    const interviews = localAttempts.filter((x) => x.wantsInterview).length;
    const uniqueStudents = new Set(localAttempts.map((x) => x.phone)).size;
    return { avg, interviews, uniqueStudents, total: localAttempts.length };
  }, [localAttempts]);

  const deleteAttempt = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف محاولة الطالب ${name}؟`)) return;
    // Optimistically remove from UI immediately
    setLocalAttempts(prev => prev.filter(a => a.id !== id));
    const res = await fetch(`/api/attempts?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "✅ تم حذف المحاولة" });
      onRefresh?.();
    } else {
      // Restore on failure
      setLocalAttempts(attempts);
      toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
    }
  };

  const openAnswers = async (id: string) => {
    setLoadingAttempt(true);
    setViewAttempt({ loading: true });
    try {
      const res = await fetch(`/api/attempts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setViewAttempt(data);
      } else {
        toast({ title: "تعذر جلب تفاصيل الإجابات", variant: "destructive" });
        setViewAttempt(null);
      }
    } catch (err) {
      setViewAttempt(null);
    }
    setLoadingAttempt(false);
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t("totalStudents"), value: stats.total, emoji: "👥", bg: "bg-purple-100" },
            { label: "طلبة فريدون", value: stats.uniqueStudents, emoji: "🧑‍🎓", bg: "bg-amber-100" },
            { label: t("avgPercent"), value: `${stats.avg}%`, emoji: "📈", bg: "bg-orange-100" },
            { label: t("interviewReq"), value: stats.interviews, emoji: "🎥", bg: "bg-teal-100" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`card-fun p-4 ${s.bg} bg-opacity-60`}
            >
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="text-2xl font-extrabold text-purple-900">{s.value}</div>
              <div className="text-xs text-purple-600 font-bold">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <a
          href={`/api/export?testId=${encodeURIComponent(exportTestId)}`}
          className="btn-fun inline-flex items-center gap-2 bg-gradient-to-l from-emerald-500 to-teal-500 text-white text-sm px-5 py-3"
          style={{ ["--btn-fun-shadow" as string]: "#0f766e" }}
        >
          {t("exportExcel")}
        </a>
      </div>

      <div className="card-fun p-2 sm:p-4 overflow-hidden">
        <div className="overflow-x-auto max-h-[55vh] overflow-y-auto rounded-xl">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-purple-50 z-10">
              <tr className="text-purple-900">
                <th className="p-3 text-right font-extrabold">{t("name")}</th>
                <th className="p-3 text-right font-extrabold">{t("phone")}</th>
                <th className="p-3 text-right font-extrabold">{t("ageCol")}</th>
                <th className="p-3 text-right font-extrabold">{t("countryCol")}</th>
                {showTest && <th className="p-3 text-right font-extrabold">{t("test")}</th>}
                <th className="p-3 text-right font-extrabold">{t("score")}</th>
                <th className="p-3 text-right font-extrabold">{t("level")}</th>
                <th className="p-3 text-right font-extrabold">{t("interviewCol")}</th>
                <th className="p-3 text-right font-extrabold">{t("date")}</th>
                <th className="p-3 text-right font-extrabold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && localAttempts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10">
                    <span className="animate-spin inline-block rounded-full h-8 w-8 border-b-2 border-purple-500" />
                  </td>
                </tr>
              ) : localAttempts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-purple-400 font-bold">
                    {emptyNote ?? t("noAttempts")}
                  </td>
                </tr>
              ) : (
                localAttempts.map((a) => (
                  <tr key={a.id} className="border-t border-purple-50 hover:bg-purple-50/50">
                    <td className="p-3 font-bold text-purple-900">{a.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <a
                          href={`tel:${a.phone}`}
                          title="اتصال"
                          className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-sm"
                        >
                          📞
                        </a>
                        <a
                          href={`https://wa.me/${a.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`أهلاً ${a.name}، تواصلنا معك من معهد السلام الثقافي بخصوص نتيجتك في ${a.testTitle}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="تواصل مباشر عبر واتساب"
                          className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-sm"
                        >
                          💬
                        </a>
                        <span className="font-semibold text-purple-700 whitespace-nowrap text-xs">
                          {a.phone}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-purple-700">{a.age}</td>
                    <td className="p-3 font-semibold text-purple-700">{a.country}</td>
                    {showTest && (
                      <td className="p-3 font-semibold text-purple-700 whitespace-nowrap">
                        {a.testEmoji} {a.testTitle}
                      </td>
                    )}
                    <td className="p-3 font-bold whitespace-nowrap">
                      <span className="text-purple-900">{a.score}</span>
                      <span className="text-purple-400">/{a.total}</span>
                      <span className="text-orange-500 text-xs"> ({a.percentage}%)</span>
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-block rounded-full px-3 py-1 text-white font-bold text-xs whitespace-nowrap"
                        style={{ background: LEVEL_COLORS[a.level] ?? "#a855f7" }}
                      >
                        {a.levelName}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {a.wantsInterview ? (
                        <span className="inline-block bg-teal-100 text-teal-700 rounded-full px-2.5 py-1 font-bold text-xs">
                          ✅ {t("requested")}
                        </span>
                      ) : (
                        <span className="text-purple-300">{t("no")}</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-purple-500 font-semibold whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleDateString("ar", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openAnswers(a.id)}
                          className="rounded bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 text-xs font-bold whitespace-nowrap"
                        >
                          إجابات الطالب
                        </button>
                        <button
                          onClick={() => deleteAttempt(a.id, a.name)}
                          className="rounded bg-red-50 hover:bg-red-100 text-red-500 px-2 py-1 text-xs font-bold"
                          title="حذف المحاولة للسماح للطالب بالإعادة"
                        >
                          🗑️
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

      <Dialog open={!!viewAttempt} onOpenChange={(open) => !open && setViewAttempt(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-purple-900">
              إجابات الطالب {viewAttempt?.student?.name}
            </DialogTitle>
          </DialogHeader>
          {viewAttempt?.loading ? (
            <div className="flex justify-center py-10">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : viewAttempt?.test ? (
            <div className="space-y-6 mt-4">
              {viewAttempt.test.questions.map((q: any, idx: number) => {
                const parsedAnswers = JSON.parse(viewAttempt.answersJson || "[]");
                const ans = parsedAnswers.find((x: any) => x.questionId === q.id);
                const options = JSON.parse(q.optionsJson || "[]");
                const chosenOpt = ans !== undefined ? options[ans.selected] : null;
                const isCorrect = viewAttempt.test.kind === "points" ? ans?.selected === q.answerIndex : true;
                
                return (
                  <div key={q.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
                    <p className="font-extrabold text-purple-900 mb-2">
                      <span className="text-purple-500 ml-1">{idx + 1}.</span>
                      {q.text}
                    </p>
                    <div className="text-sm font-semibold mt-2 p-2 rounded bg-white border border-purple-100">
                      <span className="text-purple-500 ml-2">الإجابة المختارة:</span>
                      <span className={viewAttempt.test.kind === "points" ? (isCorrect ? "text-emerald-600" : "text-red-600") : "text-purple-900"}>
                        {ans !== undefined ? (typeof chosenOpt === "string" ? chosenOpt : (chosenOpt?.text || "غير معروف")) : "لم يجب"}
                      </span>
                      {viewAttempt.test.kind === "points" && ans?.selected !== q.answerIndex && (
                        <div className="mt-1 text-emerald-600">
                          <span className="text-purple-500 ml-2">الإجابة الصحيحة:</span>
                          {typeof options[q.answerIndex] === "string" ? options[q.answerIndex] : options[q.answerIndex]?.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-red-500 font-bold">تعذر تحميل الإجابات</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
