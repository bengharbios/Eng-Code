"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { ACADEMIC_PHONE, ACADEMIC_PHONE_INTL } from "@/lib/config";
import type { PublicTest, SubmitResult } from "@/lib/shared-types";
import CertificateView from "@/components/certificate/CertificateView";

export default function ResultView({
  result,
  studentName,
  studentPhone = "",
  test,
  onRetake,
  onBack,
  siteSettings: initialSettings,
}: {
  result: SubmitResult;
  studentName: string;
  studentPhone?: string;
  test?: PublicTest | null;
  onRetake: () => void;
  onBack: () => void;
  siteSettings?: Record<string, string>;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [wantsInterview, setWantsInterview] = useState(false);
  const [savingInterview, setSavingInterview] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings || {});
  
  // Certificate states
  const [certNameAr, setCertNameAr] = useState(studentName || "");
  const [certNameEn, setCertNameEn] = useState("");
  const [isKhdaCert, setIsKhdaCert] = useState(false);
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [certRequested, setCertRequested] = useState(false);
  const [sendingCertWhatsapp, setSendingCertWhatsapp] = useState(false);

  const allowCert = test?.allowCertificate !== false;
  const allowKhdaOption = test?.allowKhdaAttestation !== false;
  const testType = test?.certificateType || "level";
  const testTitle = test?.title || "اختبار تحديد المستوى";

  const level = result.level;
  const isDiagnostic = result.mode === "diagnostic";

  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      setSettings(initialSettings);
    } else {
      fetch("/api/admin/settings", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data === "object") setSettings(data);
        })
        .catch(() => {});
    }
  }, [initialSettings]);

  useEffect(() => {
    const mk = (opts: confetti.Options) =>
      confetti({ disableForReducedMotion: true, ...opts });
    const t1 = setTimeout(
      () =>
        mk({
          particleCount: 130,
          spread: 100,
          origin: { x: 0.5, y: 0.35 },
          colors: ["#f59e0b", "#f97316", "#a855f7", "#14b8a6", "#ec4899"],
        }),
      300
    );
    const t2 = setTimeout(
      () =>
        mk({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.6 },
          colors: ["#f59e0b", "#f97316", "#a855f7"],
        }),
      700
    );
    const t3 = setTimeout(
      () =>
        mk({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.6 },
          colors: ["#14b8a6", "#ec4899", "#facc15"],
        }),
      1000
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const requestInterview = async () => {
    setSavingInterview(true);
    try {
      const res = await fetch("/api/attempts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: result.attemptId }),
      });
      if (!res.ok) throw new Error();
      setWantsInterview(true);
      toast({ title: t("savedOk"), description: t("step2") });
    } catch {
      toast({
        title: t("saveFailed"),
        description: t("step1"),
        variant: "destructive",
      });
    } finally {
      setSavingInterview(false);
    }
  };

  const showZoom = settings.showZoomSection !== "false";
  const zoomTitle = settings.zoomTitle || t("wantZoom");
  const zoomDesc = settings.zoomDesc || t("zoomDesc");
  const zoomBooked = settings.zoomBookedTitle || "🎊 تم تسجيل رغبتك في المقابلة! الخطوة التالية:";
  const zoomStep1 = settings.zoomStep1 || t("step1");
  const zoomStep2 = settings.zoomStep2 || t("step2");
  const phone = settings.contactPhone || ACADEMIC_PHONE;
  const rawWhatsapp = settings.whatsappPhone || ACADEMIC_PHONE_INTL;
  const whatsappClean = rawWhatsapp.replace(/[^0-9]/g, "");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-4">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="relative w-40 h-40 mx-auto"
          >
            <Image
              src="/images/mascot-celebrate.png"
              alt="احتفال بالإنجاز"
              fill
              priority
              sizes="160px"
              className="object-contain"
            />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-900 mt-2">
            {t("congrats")} {studentName}! 🎉
          </h1>
          <p className="text-purple-600 font-semibold mt-1">{t("finished")}</p>
        </div>

        {/* ===== Level card ===== */}
        <div
          className="card-fun p-6 sm:p-8 text-center"
          style={{ borderColor: level.color, background: level.color + "14" }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="text-7xl mb-2"
          >
            {level.emoji}
          </motion.div>

          <div
            className="inline-flex items-center gap-2 text-white font-extrabold text-2xl rounded-full px-8 py-2 shadow-lg"
            style={{ background: level.color }}
          >
            {isDiagnostic ? "🧭 " + t("yourLevel") : t("yourLevel") + ": " + level.code}
          </div>

          <h2 className="text-2xl font-extrabold text-purple-900 mt-3 leading-snug">
            {level.name}
          </h2>

          {/* Stars */}
          <div className="flex justify-center gap-1.5 my-4" dir="ltr">
            {[...Array(5)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
                className={`text-4xl ${i < result.stars ? "" : "opacity-25 grayscale"}`}
              >
                ⭐
              </motion.span>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!isDiagnostic && (
              <div className="bg-white/90 rounded-2xl px-6 py-3 border-2 border-purple-100 shadow-sm">
                <span className="text-3xl font-extrabold text-purple-800">
                  {result.score}
                </span>
                <span className="text-purple-400 font-bold"> / {result.total}</span>
                <span className="block text-sm text-purple-500 font-semibold">
                  {t("points")}
                </span>
              </div>
            )}
            <div className="bg-white/90 rounded-2xl px-6 py-3 border-2 border-purple-100 shadow-sm">
              <span className="text-3xl font-extrabold text-orange-500">
                {result.percentage}%
              </span>
              <span className="block text-sm text-purple-500 font-semibold">
                {t("accuracy")}
              </span>
            </div>
          </div>

          {level.description && (
            <p className="text-purple-800 leading-relaxed mt-5 text-base sm:text-lg font-medium">
              {level.description}
            </p>
          )}
        </div>

        {/* ===== Recommended program ===== */}
        {level.program && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-5 bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white rounded-3xl p-5 sm:p-6 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">🎓</span>
              <div>
                <p className="font-bold text-lg">{t("recommended")}</p>
                <p className="text-xl font-extrabold leading-snug">{level.program}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== Zoom interview ===== */}
        {showZoom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="card-fun mt-5 p-6 sm:p-7"
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl">🎥</span>
              <div className="flex-1">
                <h3 className="font-extrabold text-purple-900 text-xl">{zoomTitle}</h3>
                <p className="text-purple-600 font-medium mt-1 leading-relaxed whitespace-pre-line">
                  {zoomDesc}
                </p>

                {!wantsInterview ? (
                  <Button
                    onClick={requestInterview}
                    disabled={savingInterview}
                    className="btn-fun mt-4 bg-gradient-to-l from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-lg px-8 py-5 h-auto"
                    style={{ ["--btn-fun-shadow" as string]: "#0f766e" }}
                  >
                    {savingInterview ? t("booking") : t("bookZoom")}
                  </Button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="bg-teal-50 border-2 border-teal-300 text-teal-800 rounded-2xl px-4 py-3 font-bold whitespace-pre-line">
                      {zoomBooked}
                    </div>
                    <ul className="space-y-2 text-purple-800 font-semibold">
                      <li className="flex items-start gap-2 whitespace-pre-line">
                        {zoomStep1.startsWith("1️⃣") ? zoomStep1 : `1️⃣ ${zoomStep1}`}
                      </li>
                      <li className="flex items-start gap-2 whitespace-pre-line">
                        {zoomStep2.startsWith("2️⃣") ? zoomStep2 : `2️⃣ ${zoomStep2}`}
                      </li>
                    </ul>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <a
                        href={`tel:${phone}`}
                        className="btn-fun inline-flex items-center gap-2 bg-gradient-to-l from-orange-500 to-amber-400 text-white text-lg px-6 py-3.5"
                        style={{ ["--btn-fun-shadow" as string]: "#c2410c" }}
                      >
                        📞 <span dir="ltr">{phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/${whatsappClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-fun inline-flex items-center gap-2 bg-gradient-to-l from-green-500 to-emerald-400 text-white text-lg px-6 py-3.5"
                        style={{ ["--btn-fun-shadow" as string]: "#15803d" }}
                      >
                        💬 {t("whatsapp")}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== Certificate Request Section ===== */}
        {allowCert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="card-fun mt-5 p-6 sm:p-7 border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-purple-50/50"
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl">📜</span>
              <div className="flex-1">
                <h3 className="font-extrabold text-amber-950 text-xl">
                  إصدار شهادة حضور وتحديد مستوى رسمية
                </h3>
                <p className="text-amber-800 text-sm font-semibold mt-1">
                  يمكنك معاينة شهادتك وطباعتها فوراً أو طلب اعتماد هيئة المعرفة KHDA.
                </p>

                {/* Certificate Type Selection Options */}
                <div className="mt-4 space-y-3">
                  <div
                    onClick={() => setIsKhdaCert(false)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                      !isKhdaCert
                        ? "bg-amber-100/80 border-amber-500 text-amber-950 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-amber-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="certType"
                      checked={!isKhdaCert}
                      onChange={() => setIsKhdaCert(false)}
                      className="mt-1 accent-amber-600 cursor-pointer"
                    />
                    <div>
                      <p className="font-extrabold text-sm sm:text-base">
                        🎓 شهادة حضور / مستوى مجانية (معهد السلام الثقافي - فرع)
                      </p>
                      <p className="text-xs text-amber-800 font-medium">
                        شهادة إلكترونية معتمدة مع ختم وتوقيع المعهد الرسميين (مجانية وإصدار فوري).
                      </p>
                    </div>
                  </div>

                  {allowKhdaOption && (
                    <div
                      onClick={() => setIsKhdaCert(true)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                        isKhdaCert
                          ? "bg-pink-100/80 border-pink-500 text-pink-950 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-pink-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="certType"
                        checked={isKhdaCert}
                        onChange={() => setIsKhdaCert(true)}
                        className="mt-1 accent-pink-600 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-extrabold text-sm sm:text-base">
                            🏛️ شهادة مصدقة من هيئة المعرفة والتنمية البشرية (KHDA - دبي)
                          </p>
                          <span className="bg-pink-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                            رسوم الاعتماد {test?.khdaFee || 140} درهم
                          </span>
                        </div>
                        <p className="text-xs text-pink-800 font-medium mt-0.5">
                          تستغرق من 2 إلى 5 أيام عمل للتصديق الرسمي من هيئة المعرفة KHDA في دبي.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Full Name Input Notice & Fields */}
                <div className="mt-4 bg-amber-100/60 border border-amber-300 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5 leading-relaxed">
                    ⚠️ يرجى كتابة الاسم الكامل بدقة باللغتين العربية والإنجليزي لأنه سيعرض في الشهادة الرسمية:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-amber-950 mb-1">
                        الاسم الكامل باللغة العربية *
                      </label>
                      <input
                        type="text"
                        value={certNameAr}
                        onChange={(e) => setCertNameAr(e.target.value)}
                        placeholder="مثال: محمد صالح إبراهيم علي مطاوع"
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-amber-950 mb-1">
                        Full Name in English (الاسم بالإنجليزية)
                      </label>
                      <input
                        type="text"
                        value={certNameEn}
                        onChange={(e) => setCertNameEn(e.target.value)}
                        placeholder="Example: Mohammad Saleh Ibrahim Ali Mtawa"
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!certNameAr.trim()) {
                        toast({ title: "يرجى كتابة الاسم بالعربية أولاً لمعاينة الشهادة", variant: "destructive" });
                        return;
                      }
                      setShowCertPreview(true);
                    }}
                    className="btn-fun bg-gradient-to-l from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-base px-6 py-4 h-auto shadow-md"
                  >
                    👁️ معاينة وطباعة الشهادة
                  </Button>

                  <Button
                    type="button"
                    onClick={async () => {
                      if (!certNameAr.trim()) {
                        toast({ title: "يرجى كتابة الاسم باللغة العربية أولاً", variant: "destructive" });
                        return;
                      }
                      setSendingCertWhatsapp(true);
                      try {
                        await fetch("/api/attempts", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            attemptId: result.attemptId,
                            certRequested: true,
                            certDetailsJson: JSON.stringify({
                              nameAr: certNameAr.trim(),
                              nameEn: certNameEn.trim(),
                              isKhda: isKhdaCert,
                              requestedAt: new Date().toISOString(),
                            }),
                          }),
                        }).catch(() => {});

                        setCertRequested(true);
                        toast({ title: "✅ تم تسجيل طلب الشهادة!" });

                        const certTypeName = isKhdaCert ? `مصدقة من هيئة المعرفة والتنمية البشرية KHDA (${test?.khdaFee || 140} درهم - 2-5 أيام عمل)` : "شهادة مجانية معتمدة من معهد السلام";
                        const msgText = `مرحباً، أود طلب إصدار شهادة لنتيجتي:\n\n👤 الاسم بالعربية: ${certNameAr.trim()}\n🔤 Name in English: ${certNameEn.trim() || "غير محدد"}\n📝 الاختبار: ${testTitle}\n📊 النتيجة: ${result.percentage}% (${level.name})\n📜 نوع الشهادة: ${certTypeName}\n📱 رقم الهاتف: ${studentPhone || ""}`;
                        const url = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(msgText)}`;
                        window.open(url, "_blank");
                      } catch {
                        toast({ title: t("errorGeneric"), variant: "destructive" });
                      } finally {
                        setSendingCertWhatsapp(false);
                      }
                    }}
                    disabled={sendingCertWhatsapp}
                    className="btn-fun bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base px-6 py-4 h-auto shadow-md"
                  >
                    {sendingCertWhatsapp ? "جاري الإرسال..." : "📲 طلب الشهادة عبر الواتساب"}
                  </Button>
                </div>

                {certRequested && (
                  <p className="text-xs font-bold text-emerald-700 mt-2">
                    ✅ تم تسجيل طلبك وإعادة توجيهك للواتساب لإكمال التفاصيل!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Certificate Printable Modal View */}
        {showCertPreview && (
          <CertificateView
            data={{
              studentNameAr: certNameAr.trim() || studentName,
              studentNameEn: certNameEn.trim(),
              testTitle: testTitle,
              testType: testType,
              scorePercent: result.percentage,
              levelCode: level.code,
              levelName: level.name,
              issueDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
              institutionName: test?.institutionName,
              institutionLogo: test?.logoUrl,
              isKhda: isKhdaCert,
              khdaFee: test?.khdaFee || 140,
              certId: result.attemptId.slice(-8).toUpperCase(),
            }}
            onClose={() => setShowCertPreview(false)}
          />
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button
            onClick={onRetake}
            variant="ghost"
            className="text-purple-500 font-bold hover:text-purple-700 hover:bg-purple-50 text-lg rounded-full"
          >
            {t("retake")}
          </Button>
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-purple-500 font-bold hover:text-purple-700 hover:bg-purple-50 text-lg rounded-full"
          >
            {t("backToTests")}
          </Button>
        </div>

        <p className="text-center text-xs text-purple-400 font-semibold mt-2 pb-6">
          {t("resultSavedNote")}
        </p>
      </motion.div>
    </div>
  );
}
