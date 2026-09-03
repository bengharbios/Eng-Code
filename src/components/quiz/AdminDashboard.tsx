"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_PASSWORD, ACADEMIC_PHONE_INTL } from "@/lib/config";
import { LEVELS } from "@/lib/quiz-data";

interface StudentRow {
  id: string;
  name: string;
  phone: string;
  age: number;
  country: string;
  score: number;
  total: number;
  percentage: number;
  level: string;
  levelName: string;
  wantsInterview: boolean;
  createdAt: string;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "#22c55e",
  A2: "#14b8a6",
  B1: "#f59e0b",
  B2: "#f97316",
  C1: "#8b5cf6",
  "": "#a855f7",
};

function levelBadge(level: string, levelName: string) {
  const color = LEVEL_COLORS[level] ?? "#a855f7";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-white font-bold text-sm"
      style={{ background: color }}
    >
      {level ? `${level} — ${levelName}` : "لم يختبر بعد"}
    </span>
  );
}

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const fetchData = useCallback(
    async (key: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/students?key=${encodeURIComponent(key)}`);
        if (res.status === 401) throw new Error("كلمة المرور غير صحيحة");
        if (!res.ok) throw new Error("خطأ في جلب البيانات");
        const data = await res.json();
        setStudents(data);
        return true;
      } catch (err) {
        toast({
          title: "خطأ 🔒",
          description:
            err instanceof Error ? err.message : "تعذر جلب البيانات",
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const handleLogin = async () => {
    const ok = await fetchData(password);
    if (ok) {
      setAuthed(true);
      toast({ title: "أهلاً بك في لوحة التحكم 👋" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف الطالب "${name}" نهائياً؟`)) return;
    try {
      const res = await fetch(
        `/api/students?id=${encodeURIComponent(id)}&key=${encodeURIComponent(password)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      setStudents((s) => s.filter((x) => x.id !== id));
      toast({ title: "تم الحذف 🗑️" });
    } catch {
      toast({
        title: "تعذر الحذف",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => fetchData(password);

  const exportCSV = () => {
    const headers = [
      "الاسم",
      "الهاتف",
      "العمر",
      "الدولة",
      "الدرجة",
      "النسبة %",
      "المستوى",
      "اسم المستوى",
      "طلب مقابلة Zoom",
      "تاريخ التسجيل",
    ];
    const rows = students.map((s) => [
      s.name,
      s.phone,
      s.age,
      s.country,
      `${s.score}/${s.total}`,
      s.percentage,
      s.level,
      s.levelName,
      s.wantsInterview ? "نعم" : "لا",
      new Date(s.createdAt).toLocaleString("ar"),
    ]);
    const csv =
      "\uFEFF" +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
        s.country.toLowerCase().includes(q);
      const matchL = levelFilter === "all" || s.level === levelFilter;
      return matchQ && matchL;
    });
  }, [students, search, levelFilter]);

  const stats = useMemo(() => {
    const total = students.length;
    const tested = students.filter((s) => s.level);
    const avg =
      tested.length > 0
        ? Math.round(
            tested.reduce((a, s) => a + s.percentage, 0) / tested.length
          )
        : 0;
    const interviews = students.filter((s) => s.wantsInterview).length;
    const dist: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
    tested.forEach((s) => {
      if (dist[s.level] !== undefined) dist[s.level]++;
    });
    return { total, avg, interviews, dist, testedCount: tested.length };
  }, [students]);

  // ===== Password gate =====
  if (!authed) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-fun p-8 w-full max-w-sm text-center"
        >
          <div className="text-6xl mb-3">🔐</div>
          <h2 className="text-2xl font-extrabold text-purple-900">
            لوحة تحكم المشرف
          </h2>
          <p className="text-purple-500 font-semibold text-sm mt-1 mb-5">
            هذه المنطقة مخصصة للفريق الأكاديمي فقط
          </p>
          <div className="space-y-4">
            <div className="space-y-2 text-right">
              <Label className="text-purple-900 font-bold">كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className="h-12 rounded-2xl border-2 border-purple-200 text-center"
                dir="ltr"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white text-lg py-5 h-auto"
              style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
            >
              {loading ? "جاري الدخول..." : "دخول 🔑"}
            </Button>
            <Button
              onClick={onBack}
              variant="ghost"
              className="w-full text-purple-500 font-bold rounded-full"
            >
              ← رجوع للاختبار
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== Dashboard =====
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-purple-900">
              📊 لوحة تحكم الطلبة
            </h1>
            <p className="text-purple-500 font-semibold text-sm mt-1">
              بيانات الطلبة ونتائجهم وطلبات المقابلات — للتواصل المباشر معهم
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportCSV}
              className="btn-fun bg-gradient-to-l from-teal-500 to-emerald-500 text-white"
              style={{ ["--btn-fun-shadow" as string]: "#0f766e" }}
            >
              ⬇️ تصدير CSV
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="rounded-full border-2 border-purple-200 font-bold"
            >
              🔄 تحديث
            </Button>
            <Button
              onClick={onBack}
              variant="ghost"
              className="rounded-full font-bold text-purple-500"
            >
              ← رجوع
            </Button>
          </div>
        </div>

        {/* ===== Stats ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "إجمالي الطلبة",
              value: stats.total,
              emoji: "👥",
              bg: "bg-purple-100",
            },
            {
              label: "أكملوا الاختبار",
              value: stats.testedCount,
              emoji: "🎯",
              bg: "bg-amber-100",
            },
            {
              label: "متوسط النسبة",
              value: `${stats.avg}%`,
              emoji: "📈",
              bg: "bg-orange-100",
            },
            {
              label: "طلبات مقابلة Zoom",
              value: stats.interviews,
              emoji: "🎥",
              bg: "bg-teal-100",
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`card-fun p-5 ${s.bg} bg-opacity-60`}
            >
              <div className="text-3xl mb-1">{s.emoji}</div>
              <div className="text-3xl font-extrabold text-purple-900">
                {s.value}
              </div>
              <div className="text-sm text-purple-600 font-bold">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ===== Level distribution ===== */}
        <div className="card-fun p-5 mb-6">
          <h3 className="font-extrabold text-purple-900 mb-3">
            🌈 توزيع المستويات
          </h3>
          <div className="space-y-2.5">
            {LEVELS.map((lvl) => {
              const count = stats.dist[lvl.code] ?? 0;
              const pct =
                stats.testedCount > 0
                  ? Math.round((count / stats.testedCount) * 100)
                  : 0;
              return (
                <div key={lvl.code} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-bold text-sm text-purple-800">
                    {lvl.emoji} {lvl.code} — {lvl.nameAr}
                  </span>
                  <div className="flex-1 h-6 bg-purple-50 rounded-full overflow-hidden border border-purple-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full flex items-center justify-end pr-2"
                      style={{ background: lvl.color }}
                    >
                      {pct > 15 && (
                        <span className="text-white text-xs font-bold">
                          {count}
                        </span>
                      )}
                    </motion.div>
                  </div>
                  <span className="w-12 text-left font-bold text-purple-500 text-sm">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Filters ===== */}
        <div className="card-fun p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث بالاسم أو الهاتف أو الدولة..."
            className="h-11 rounded-2xl border-2 border-purple-200"
          />
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-52 h-11 rounded-2xl border-2 border-purple-200">
              <SelectValue placeholder="كل المستويات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المستويات</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.code} — {l.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ===== Students table ===== */}
        <div className="card-fun p-2 sm:p-4 overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-xl">
            <Table>
              <TableHeader className="sticky top-0 bg-purple-50 z-10">
                <TableRow className="hover:bg-purple-50">
                  <TableHead className="font-extrabold text-purple-900">
                    الاسم
                  </TableHead>
                  <TableHead className="font-extrabold text-purple-900">
                    التواصل
                  </TableHead>
                  <TableHead className="font-extrabold text-purple-900">
                    العمر
                  </TableHead>
                  <TableHead className="font-extrabold text-purple-900">
                    الدولة
                  </TableHead>
                  <TableHead className="font-extrabold text-purple-900">
                    النتيجة
                  </TableHead>
                  <TableHead className="font-extrabold text-purple-900">
                    المستوى
                  </TableHead>
                  <TableHead className="font-extrabold text-purple-900">
                    مقابلة Zoom
                  </TableHead>
                  <TableHead className="font-extrabold text-purple-900">
                    التاريخ
                  </TableHead>
                  <TableHead className="font-extrabold text-purple-900">
                    حذف
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <span className="animate-spin inline-block rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-purple-400 font-bold"
                    >
                      {students.length === 0
                        ? "لا يوجد طلبة بعد — شارك رابط الاختبار في الويبينار! 🚀"
                        : "لا نتائج مطابقة للبحث"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id} className="hover:bg-purple-50/50">
                      <TableCell className="font-bold text-purple-900">
                        {s.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <a
                            href={`tel:${s.phone}`}
                            title="اتصال"
                            className="w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-base"
                          >
                            📞
                          </a>
                          <a
                            href={`https://wa.me/${s.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="واتساب"
                            className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-base"
                          >
                            💬
                          </a>
                          <span className="text-sm font-semibold text-purple-700 whitespace-nowrap">
                            {s.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-purple-700">
                        {s.age}
                      </TableCell>
                      <TableCell className="font-semibold text-purple-700">
                        {s.country}
                      </TableCell>
                      <TableCell className="font-bold whitespace-nowrap">
                        <span className="text-purple-900">{s.score}</span>
                        <span className="text-purple-400">/{s.total}</span>
                        <span className="text-orange-500 text-sm">
                          {" "}
                          ({s.percentage}%)
                        </span>
                      </TableCell>
                      <TableCell>
                        {levelBadge(s.level, s.levelName)}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.wantsInterview ? (
                          <span className="inline-block bg-teal-100 text-teal-700 rounded-full px-3 py-1 font-bold text-sm">
                            ✅ مطلوبة
                          </span>
                        ) : (
                          <span className="text-purple-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-purple-500 font-semibold whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString("ar", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          title="حذف"
                          className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center font-bold"
                        >
                          🗑️
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-center text-xs text-purple-400 font-semibold mt-4 pb-8">
          💡 نصيحة: اضغط 📞 للاتصال المباشر، أو 💬 للمراسلة عبر واتساب — رقم
          الفريق الأكاديمي: <span dir="ltr">{ACADEMIC_PHONE_INTL}</span>
        </p>
      </div>
    </div>
  );
}
