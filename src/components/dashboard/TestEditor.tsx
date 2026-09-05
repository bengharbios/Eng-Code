"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useI18n, TEST_LANGUAGES } from "@/lib/i18n";
import { useSession } from "@/components/SessionProvider";
import { playClick } from "@/lib/sounds";
import type { Outcome, OutcomesDoc } from "@/lib/scoring";

interface QOption {
  text: string;
  bucket?: string;
}
interface QItem {
  type: string;
  text: string;
  passage: string;
  emoji: string;
  options: QOption[];
  answerIndex: number;
  points: number;
}

const BUCKETS = ["A", "B", "C", "D"];
const PALETTE = ["#7c3aed", "#0e7490", "#f97316", "#e11d48", "#059669", "#d946ef"];
const EMOJIS = ["📝", "🚀", "🧭", "🎯", "🧠", "🌟", "📚", "🎮", "🏆", "🦉", "💡", "🔤"];

function emptyQuestion(kind: string): QItem {
  return {
    type: "choice",
    text: "",
    passage: "",
    emoji: "",
    options:
      kind === "diagnostic"
        ? [
            { text: "", bucket: "A" },
            { text: "", bucket: "B" },
            { text: "", bucket: "C" },
          ]
        : [
            { text: "" },
            { text: "" },
            { text: "" },
            { text: "" },
          ],
    answerIndex: 0,
    points: 5,
  };
}

export default function TestEditor({
  testId,
  onSaved,
  onCancel,
}: {
  testId: string | null;
  onSaved: (slug: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(testId !== null);
  const [saving, setSaving] = useState(false);
  const [isSystem, setIsSystem] = useState(false);
  const [slug, setSlug] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("ar");
  const [kind, setKind] = useState("points");
  const [emoji, setEmoji] = useState("📝");
  const [color, setColor] = useState("#7c3aed");
  const [levelTag, setLevelTag] = useState("general");
  const [passPercent, setPassPercent] = useState(50);
  const [timeLimitMin, setTimeLimitMin] = useState(0);
  const [allowRetake, setAllowRetake] = useState(true);
  const [accreditation, setAccreditation] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [allowCertificate, setAllowCertificate] = useState(true);
  const [certificateType, setCertificateType] = useState<"attendance" | "level">("level");
  const [allowKhdaAttestation, setAllowKhdaAttestation] = useState(true);
  const [khdaFee, setKhdaFee] = useState(140);
  const [certTitleAr, setCertTitleAr] = useState("");
  const [certTitleEn, setCertTitleEn] = useState("");
  const [questions, setQuestions] = useState<QItem[]>([emptyQuestion("points")]);
  const [outcomes, setOutcomes] = useState<OutcomesDoc>({
    buckets: [],
    tie: { key: "TIE", emoji: "🔄", title: "", description: "", program: "", color: "#14b8a6" },
  });

  const { user } = useSession();
  const [instructorsList, setInstructorsList] = useState<{ id: string; name: string; username: string }[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  useEffect(() => {
    if (user?.role === "super") {
      fetch("/api/instructors", { cache: "no-store" })
        .then((r) => r.json())
        .then((list) => Array.isArray(list) && setInstructorsList(list))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (testId === null) return;
    let alive = true;
    setLoading(true);
    fetch(`/api/tests/${testId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive || d.error) return;
        setIsSystem(Boolean(d.isSystem));
        setSlug(d.slug);
        setTitle(d.title);
        if (d.ownerId) setSelectedOwnerId(d.ownerId);
        setDescription(d.description);
        setLanguage(d.language);
        setKind(d.kind);
        setEmoji(d.emoji);
        setColor(d.color);
        setLevelTag(d.levelTag);
        setPassPercent(d.passPercent);
        setTimeLimitMin(d.timeLimitMin);
        setAllowRetake(d.allowRetake ?? true);
        setAccreditation(d.accreditation || "");
        setLogoUrl(d.logoUrl || "");
        setInstitutionName(d.institutionName || "");
        setAllowCertificate(d.allowCertificate ?? true);
        setCertificateType(d.certificateType || "level");
        setAllowKhdaAttestation(d.allowKhdaAttestation ?? true);
        setKhdaFee(d.khdaFee ?? 140);
        setCertTitleAr(d.certTitleAr || "");
        setCertTitleEn(d.certTitleEn || "");
        setQuestions(
          (d.questions || []).map(
            (q: {
              type: string;
              text: string;
              passage: string;
              emoji: string;
              options: QOption[];
              answerIndex: number;
              points: number;
            }) => ({
              type: q.type,
              text: q.text,
              passage: q.passage || "",
              emoji: q.emoji || "",
              options: q.options || [],
              answerIndex: q.answerIndex ?? 0,
              points: q.points || 5,
            })
          )
        );
        if (d.outcomes) setOutcomes(d.outcomes);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [testId]);

  const usedBuckets = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) =>
      q.options.forEach((o) => {
        if (o.bucket) set.add(o.bucket);
      })
    );
    return BUCKETS.filter((b) => set.has(b));
  }, [questions]);

  const updateQ = (i: number, patch: Partial<QItem>) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };
  const updateOpt = (qi: number, oi: number, patch: Partial<QOption>) => {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) }
          : q
      )
    );
  };
  const moveQ = (i: number, dir: -1 | 1) => {
    setQuestions((qs) => {
      const j = i + dir;
      if (j < 0 || j >= qs.length) return qs;
      const copy = [...qs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const setOutcomeField = (key: string, patch: Partial<Outcome>, isTie = false) => {
    setOutcomes((prev) => {
      if (isTie) return { ...prev, tie: { ...prev.tie, ...patch, key: "TIE" } };
      const buckets = [...prev.buckets];
      const idx = buckets.findIndex((b) => b.key === key);
      if (idx >= 0) buckets[idx] = { ...buckets[idx], ...patch, key };
      else
        buckets.push({
          key,
          emoji: "🎯",
          title: "",
          description: "",
          program: "",
          color: "#7c3aed",
          ...patch,
        });
      return { ...prev, buckets };
    });
  };

  const save = async () => {
    playClick();
    if (!title.trim()) {
      toast({ title: t("titleRequired"), variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: t("atLeastOneQ"), variant: "destructive" });
      return;
    }
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim() || q.options.filter((o) => o.text.trim()).length < 2) {
        toast({
          title: `السؤال ${i + 1}: النص وخياران على الأقل مطلوبان`,
          variant: "destructive",
        });
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description,
        language,
        kind,
        emoji,
        color,
        levelTag,
        passPercent,
        timeLimitMin,
        allowRetake,
        accreditation,
        logoUrl,
        institutionName,
        allowCertificate,
        certificateType,
        allowKhdaAttestation,
        khdaFee,
        certTitleAr,
        certTitleEn,
        ownerId: selectedOwnerId || undefined,
        outcomes: kind === "diagnostic" ? outcomes : null,
        questions: questions.map((q) => ({
          ...q,
          options: q.options.filter((o) => o.text.trim()),
        })),
      };
      const res = await fetch(testId ? `/api/tests/${testId}` : "/api/tests", {
        method: testId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "server");
      toast({ title: t("saved") });
      onSaved(data.slug || slug);
    } catch (err) {
      toast({
        title: err instanceof Error && err.message === "locked" ? t("systemLockedNote") : t("errorGeneric"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 max-w-4xl mx-auto"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-purple-900">
          {testId ? `✏️ ${t("edit")}` : `➕ ${t("newTest")}`}
          {isSystem && (
            <span className="mr-2 text-xs bg-cyan-100 text-cyan-700 border border-cyan-300 rounded-full px-2.5 py-1 font-bold">
              🔒 {t("system")}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="btn-fun bg-gradient-to-l from-emerald-500 to-teal-500 text-white" style={{ ["--btn-fun-shadow" as string]: "#0f766e" }}>
            {saving ? t("savingTest") : t("save")}
          </Button>
          <Button onClick={onCancel} variant="ghost" className="rounded-full font-bold text-purple-500">
            {t("backHome")}
          </Button>
        </div>
      </div>

      {/* ===== Meta ===== */}
      <div className="card-fun p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label className="font-bold text-purple-900">{t("testTitle")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-2xl border-2 border-purple-200" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="font-bold text-purple-900">{t("testDesc")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-2xl border-2 border-purple-200" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="font-bold text-purple-900">👩‍🏫 المحاضر صاحب الاختبار</Label>
            {user?.role === "super" ? (
              <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                <SelectTrigger className="h-11 rounded-2xl border-2 border-purple-200 bg-white">
                  <SelectValue placeholder="اختر المحاضر صاحب الاختبار..." />
                </SelectTrigger>
                <SelectContent>
                  {instructorsList.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name} (@{inst.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={user?.name || "المحاضر"}
                disabled
                className="h-11 rounded-2xl border-2 border-purple-200 bg-purple-50 font-bold text-purple-900"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-purple-900">{t("testKind")}</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="h-11 rounded-2xl border-2 border-purple-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="points">{t("kindPoints")}</SelectItem>
                <SelectItem value="diagnostic">{t("kindDiagnostic")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-purple-900">{t("testLang")}</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-11 rounded-2xl border-2 border-purple-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEST_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {kind === "points" && (
            <>
              <div className="space-y-2">
                <Label className="font-bold text-purple-900">{t("levelTag")}</Label>
                <Select value={levelTag} onValueChange={setLevelTag}>
                  <SelectTrigger className="h-11 rounded-2xl border-2 border-purple-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t("levelGeneral")}</SelectItem>
                    <SelectItem value="CEFR">{t("levelCEFR")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-purple-900">{t("passPercent")}</Label>
                <Input type="number" min={0} max={100} value={passPercent} onChange={(e) => setPassPercent(Number(e.target.value))} className="h-11 rounded-2xl border-2 border-purple-200" />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label className="font-bold text-purple-900">{t("timeLimit")}</Label>
            <Input type="number" min={0} max={180} value={timeLimitMin} onChange={(e) => setTimeLimitMin(Number(e.target.value))} className="h-11 rounded-2xl border-2 border-purple-200" />
          </div>
          <div className="flex flex-col justify-center space-y-2 pt-2">
            <Label className="font-bold text-purple-900">يسمح للطالب بإعادة الاختبار؟</Label>
            <div className="flex items-center gap-3">
              <Switch checked={allowRetake} onCheckedChange={setAllowRetake} />
              <span className="text-sm text-purple-600 font-semibold">{allowRetake ? "نعم" : "لا (مرة واحدة فقط)"}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-purple-900">{t("emoji")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border-2 ${emoji === e ? "border-purple-500 bg-purple-100" : "border-purple-100 hover:bg-purple-50"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-purple-900">{t("color")}</Label>
            <div className="flex gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full border-4 ${color === c ? "border-purple-900" : "border-white"} shadow`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="font-bold text-purple-900">{t("accreditationLabel")}</Label>
            <Textarea value={accreditation} onChange={(e) => setAccreditation(e.target.value)} rows={3} className="rounded-2xl border-2 border-cyan-200 bg-cyan-50/50" />
          </div>
          <div className="space-y-2 sm:col-span-2 card-fun p-4 bg-teal-50/60 !border-teal-200">
            <Label className="font-bold text-teal-900 flex items-center gap-2">
              🖼️ شعار المؤسسة / المحاضر (شعار خاص يظهر للطالب عند دخول هذا الاختبار)
            </Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt="شعار المحاضر" className="w-16 h-16 object-contain rounded-xl border bg-white p-1 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-teal-300 bg-white flex items-center justify-center text-teal-400 text-2xl">
                  🖼️
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="btn-fun bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer inline-block">
                  📤 رفع / تغيير الشعار
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast({ title: "حجم الصورة كبير جداً (الأقصى 2 ميجابايت)", variant: "destructive" });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const base64 = evt.target?.result as string;
                        if (base64) setLogoUrl(base64);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-xs text-rose-600 underline block font-bold mr-2"
                  >
                    حذف الشعار
                  </button>
                )}
                <p className="text-xs text-teal-700/80 font-medium mt-1">
                  يظهر هذا الشعار للطلاب في بطاقات الصفحة الرئيسية ومقدمة وكرت الاعتماد الخاص بهذا الاختبار دون أي تغيير على شعار المعهد في الهيدر الرئيسي.
                </p>
                <div className="pt-2">
                  <Label className="font-bold text-teal-900 text-xs block mb-1">🏛️ اسم المؤسسة / المركز (يظهر بجوار الشعار واسم المحاضر وبالشهادة برعاية)</Label>
                  <Input
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="مثال: مؤسسة قيادة التعلم المرح (LFL)"
                    className="h-10 rounded-xl border border-teal-300 bg-white font-medium text-sm text-teal-950"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== Certificate Settings Panel ===== */}
          <div className="space-y-3 sm:col-span-2 card-fun p-5 bg-amber-50/60 !border-amber-300">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <Label className="font-extrabold text-amber-950 text-base flex items-center gap-2">
                📜 إعدادات وخيارات الشهادات للطلاب
              </Label>
              <div className="flex items-center gap-2">
                <Switch checked={allowCertificate} onCheckedChange={setAllowCertificate} />
                <span className="text-sm font-bold text-amber-900">
                  {allowCertificate ? "إصدار الشهادات مفعّل" : "مغلق"}
                </span>
              </div>
            </div>

            {allowCertificate && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="font-bold text-amber-900 text-xs">نوع الشهادة الصادرة للطالب</Label>
                  <Select value={certificateType} onValueChange={(val: any) => setCertificateType(val)}>
                    <SelectTrigger className="h-10 rounded-xl border-amber-300 bg-white font-bold text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="level">🎓 شهادة تحديد مستوى وإنجاز (Level / Achievement)</SelectItem>
                      <SelectItem value="attendance">📜 شهادة حضور تدريبية (Attendance)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-amber-900 text-xs">خيار تصديق هيئة المعرفة (KHDA - دبي)</Label>
                  <div className="flex items-center gap-3 h-10 px-3 bg-white border border-amber-300 rounded-xl">
                    <Switch checked={allowKhdaAttestation} onCheckedChange={setAllowKhdaAttestation} />
                    <span className="text-xs font-bold text-amber-900">
                      {allowKhdaAttestation ? "إتاحة طلب تصديق KHDA (140 درهم)" : "شهادة المعهد المجانية فقط"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="font-bold text-amber-900 text-xs">عنوان الشهادة الرئيسي بالعربية (اختياري - يترك فارغاً للعنوان الافتراضي)</Label>
                  <Input
                    value={certTitleAr}
                    onChange={(e) => setCertTitleAr(e.target.value)}
                    placeholder="مثال: شهادة تحديد مستوى وإنجاز / شهادة حضور / شهادة إتمام دورة"
                    className="h-10 rounded-xl border-amber-300 bg-white font-bold text-sm text-amber-950"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="font-bold text-amber-900 text-xs">Certificate Title in English (الترجمة الإنجليزية لعنوان الشهادة)</Label>
                  <Input
                    value={certTitleEn}
                    onChange={(e) => setCertTitleEn(e.target.value)}
                    placeholder="Example: LEVEL ASSESSMENT & ACHIEVEMENT CERTIFICATE / CERTIFICATE OF ATTENDANCE"
                    className="h-10 rounded-xl border-amber-300 bg-white font-bold text-sm text-amber-950"
                    dir="ltr"
                  />
                </div>

                {allowKhdaAttestation && (
                  <div className="space-y-1.5 sm:col-span-2 bg-amber-100/50 p-3 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label className="font-bold text-amber-950 text-xs">رسوم تصديق هيئة المعرفة KHDA (بالدرهم الإماراتي)</Label>
                        <p className="text-[11px] text-amber-800 font-medium">
                          تستغرق من 2 إلى 5 أيام عمل، والشهادة المجانية للفرع تبقى متاحة دائماً مجاناً.
                        </p>
                      </div>
                      <div className="w-32 flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={khdaFee}
                          onChange={(e) => setKhdaFee(Number(e.target.value))}
                          className="h-9 font-black text-amber-900 bg-white border-amber-300 rounded-lg text-center"
                        />
                        <span className="text-xs font-bold text-amber-900">AED</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Questions ===== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-purple-900">
            📋 {t("questions")} ({questions.length})
          </h3>
          <Button
            onClick={() => setQuestions((qs) => [...qs, emptyQuestion(kind)])}
            className="btn-fun bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white text-sm"
            style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
          >
            {t("addQuestion")}
          </Button>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="card-fun p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-purple-700 bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center">
                {qi + 1}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveQ(qi, -1)} className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold">↑</button>
                <button onClick={() => moveQ(qi, 1)} className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold">↓</button>
                <button
                  onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== qi))}
                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-purple-800">{t("qType")}</Label>
                <Select value={q.type} onValueChange={(v) => updateQ(qi, { type: v })}>
                  <SelectTrigger className="h-10 rounded-xl border-2 border-purple-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="choice">{t("typeChoice")}</SelectItem>
                    <SelectItem value="picture">{t("typePicture")}</SelectItem>
                    <SelectItem value="reading">{t("typeReading")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {q.type === "picture" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-purple-800">{t("emoji")}</Label>
                  <Input value={q.emoji} onChange={(e) => updateQ(qi, { emoji: e.target.value.slice(0, 4) })} className="h-10 rounded-xl border-2 border-purple-200 text-center text-xl" />
                </div>
              )}
              {kind === "points" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-purple-800">{t("pointsLabel")}</Label>
                  <Input type="number" min={1} max={100} value={q.points} onChange={(e) => updateQ(qi, { points: Number(e.target.value) || 5 })} className="h-10 rounded-xl border-2 border-purple-200" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-purple-800">{t("qText")}</Label>
              <Textarea value={q.text} onChange={(e) => updateQ(qi, { text: e.target.value })} rows={2} className="rounded-xl border-2 border-purple-200" />
            </div>

            {q.type === "reading" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-purple-800">{t("passage")}</Label>
                <Textarea value={q.passage} onChange={(e) => updateQ(qi, { passage: e.target.value })} rows={3} className="rounded-xl border-2 border-amber-200 bg-amber-50/50" />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-bold text-purple-800">
                {t("options")} {kind === "points" && `— ${t("correctAnswer")}`}
              </Label>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    {kind === "points" ? (
                      <button
                        onClick={() => updateQ(qi, { answerIndex: oi })}
                        title={t("correctAnswer")}
                        className={`shrink-0 w-9 h-9 rounded-xl font-extrabold border-2 ${
                          q.answerIndex === oi
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "bg-white border-purple-200 text-purple-400 hover:border-emerald-300"
                        }`}
                      >
                        ✓
                      </button>
                    ) : (
                      <select
                        value={opt.bucket || "A"}
                        onChange={(e) => updateOpt(qi, oi, { bucket: e.target.value })}
                        className="shrink-0 h-9 rounded-xl border-2 border-purple-200 bg-white text-sm font-bold text-purple-700 px-1"
                      >
                        {BUCKETS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    )}
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOpt(qi, oi, { text: e.target.value })}
                      className="h-9 rounded-xl border-2 border-purple-100 flex-1"
                    />
                    {q.options.length > 2 && (
                      <button
                        onClick={() =>
                          setQuestions((qs) =>
                            qs.map((qq, idx) =>
                              idx === qi ? { ...qq, options: qq.options.filter((_, j) => j !== oi) } : qq
                            )
                          )
                        }
                        className="shrink-0 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {q.options.length < 6 && (
                <button
                  onClick={() =>
                    setQuestions((qs) =>
                      qs.map((qq, idx) =>
                        idx === qi
                          ? { ...qq, options: [...qq.options, kind === "diagnostic" ? { text: "", bucket: "A" } : { text: "" }] }
                          : qq
                      )
                    )
                  }
                  className="text-purple-500 hover:text-purple-700 font-bold text-sm"
                >
                  ＋ {t("options")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ===== Outcomes (diagnostic) ===== */}
      {kind === "diagnostic" && (
        <div className="card-fun p-5 space-y-4">
          <h3 className="text-xl font-extrabold text-purple-900">🧭 {t("outcomes")}</h3>
          {usedBuckets.length === 0 && (
            <p className="text-purple-400 font-bold text-sm">
              حدّد تصنيفات (A/B/C) في خيارات الأسئلة أولاً
            </p>
          )}
          {usedBuckets.map((key) => {
            const oc =
              outcomes.buckets.find((b) => b.key === key) ||
              { key, emoji: "🎯", title: "", description: "", program: "", color: "#7c3aed" };
            return (
              <div key={key} className="border-2 border-purple-100 rounded-2xl p-4 space-y-3 bg-purple-50/40">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-purple-800 bg-purple-200 rounded-full w-9 h-9 flex items-center justify-center">{key}</span>
                  <Input
                    value={oc.emoji}
                    onChange={(e) => setOutcomeField(key, { emoji: e.target.value.slice(0, 4) })}
                    className="w-16 h-9 rounded-xl border-2 border-purple-200 text-center text-xl"
                    placeholder="🎯"
                  />
                  <Input
                    value={oc.title}
                    onChange={(e) => setOutcomeField(key, { title: e.target.value })}
                    className="flex-1 h-9 rounded-xl border-2 border-purple-200 font-bold"
                    placeholder={t("outcomeTitle")}
                  />
                </div>
                <Input value={oc.description} onChange={(e) => setOutcomeField(key, { description: e.target.value })} className="h-9 rounded-xl border-2 border-purple-200" placeholder={t("outcomeDesc")} />
                <Input value={oc.program} onChange={(e) => setOutcomeField(key, { program: e.target.value })} className="h-9 rounded-xl border-2 border-amber-200 bg-amber-50/50" placeholder={t("outcomeProgram")} />
              </div>
            );
          })}
          {/* Tie outcome */}
          <div className="border-2 border-teal-100 rounded-2xl p-4 space-y-3 bg-teal-50/40">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-teal-800 bg-teal-200 rounded-full px-3 h-9 flex items-center justify-center text-sm">
                {t("tieOutcome")}
              </span>
              <Input
                value={outcomes.tie.emoji}
                onChange={(e) => setOutcomeField("TIE", { emoji: e.target.value.slice(0, 4) }, true)}
                className="w-16 h-9 rounded-xl border-2 border-teal-200 text-center text-xl"
                placeholder="🔄"
              />
              <Input
                value={outcomes.tie.title}
                onChange={(e) => setOutcomeField("TIE", { title: e.target.value }, true)}
                className="flex-1 h-9 rounded-xl border-2 border-teal-200 font-bold"
                placeholder={t("outcomeTitle")}
              />
            </div>
            <Input value={outcomes.tie.description} onChange={(e) => setOutcomeField("TIE", { description: e.target.value }, true)} className="h-9 rounded-xl border-2 border-teal-200" placeholder={t("outcomeDesc")} />
            <Input value={outcomes.tie.program} onChange={(e) => setOutcomeField("TIE", { program: e.target.value }, true)} className="h-9 rounded-xl border-2 border-teal-200" placeholder={t("outcomeProgram")} />
          </div>
        </div>
      )}

      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving} className="btn-fun bg-gradient-to-l from-emerald-500 to-teal-500 text-white text-lg px-10 py-5 h-auto" style={{ ["--btn-fun-shadow" as string]: "#0f766e" }}>
          {saving ? t("savingTest") : t("save")}
        </Button>
      </div>
    </motion.div>
  );
}
