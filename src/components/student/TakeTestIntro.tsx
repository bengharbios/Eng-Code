"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
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
import { useI18n, isRtlLang } from "@/lib/i18n";
import { playClick } from "@/lib/sounds";
import type { PublicTest, StudentRegInfo } from "@/lib/shared-types";
import { useSession } from "@/components/SessionProvider";

const COUNTRIES = [
  "الإمارات العربية المتحدة", "السعودية", "الكويت", "قطر", "عُمان", "البحرين",
  "مصر", "الأردن", "فلسطين", "لبنان", "سوريا", "العراق", "اليمن", "السودان",
  "ليبيا", "تونس", "الجزائر", "المغرب", "موريتانيا", "الصومال", "جيبوتي",
  "جزر القمر", "تركية", "أخرى",
];

// ===== Intro + Registration steps; quiz & result are rendered by parent =====
export default function TakeTestIntro({
  test,
  onStart,
  onBegin,
  onBack,
}: {
  test: PublicTest;
  onStart?: (info: StudentRegInfo) => void;
  onBegin?: (info: StudentRegInfo) => void;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  const { user, refresh } = useSession();
  const [step, setStep] = useState<"intro" | "auth">("intro");
  const [phoneState, setPhoneState] = useState<"init" | "not_found" | "exists_with_password" | "exists_no_password">("init");
  const [showPassword, setShowPassword] = useState(false);

  // ===== Registration / Login =====
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleStart = (info: StudentRegInfo) => {
    const fn = onStart || onBegin;
    if (fn) fn(info);
  };

  const qDir = useMemo(() => (isRtlLang(test.language) ? "rtl" : "ltr"), [test.language]);
  const accredLines = test.accreditation
    ? test.accreditation.split("\n").filter(Boolean)
    : [];

  const checkPhone = async () => {
    playClick();
    const e: Record<string, string> = {};
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 7) e.phone = t("validPhone");
    
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/student/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhoneState(data.status);
        if (data.name) setName(data.name);
      } else {
        setErrors({ phone: "تعذر التحقق من الرقم" });
      }
    } catch (err) {
      setErrors({ phone: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  const validateAuth = (): boolean => {
    const e: Record<string, string> = {};
    if (!password) e.password = "كلمة المرور مطلوبة";
    
    if (phoneState === "not_found") {
      if (!name.trim() || name.trim().length < 3) e.name = t("fullRequired");
      const ageNum = parseInt(age, 10);
      if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 99) e.age = t("validAge");
      if (!country) e.country = t("chooseCountryErr");
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitAuth = async () => {
    playClick();
    if (!validateAuth()) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: phoneState === "not_found" ? "register" : "login",
          phone: phone.trim(),
          password,
          name: name.trim(),
          age,
          country
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === "invalid_password") setErrors({ password: "كلمة المرور غير صحيحة" });
        else if (data.error === "not_found") setErrors({ phone: "الرقم غير مسجل" });
        else if (data.error === "already_exists") setErrors({ phone: "الرقم مسجل مسبقاً" });
        else setErrors({ form: "حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى." });
        return;
      }
      
      await refresh();
      handleStart({ name: data.student.name, phone: data.student.phone, age: data.student.age?.toString() || "0", country: data.student.country || "" });
    } catch (e) {
      setErrors({ form: "تعذر الاتصال بالخادم." });
    } finally {
      setLoading(false);
    }
  };

  const submitAlreadyLoggedIn = async () => {
    playClick();
    if (!user) return;
    // user.username holds the phone number for students
    handleStart({ name: user.name, phone: user.username, age: "0", country: "" }); 
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8">
      <AnimatePresence mode="wait">
        {step === "intro" ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            {/* Test hero */}
            <div className="text-center">
              {test.logoUrl ? (
                <div className="flex justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={test.logoUrl}
                    alt={test.ownerName || "Logo"}
                    className="h-20 max-w-[240px] object-contain rounded-2xl bg-white p-2 border-2 border-purple-100 shadow-md"
                  />
                </div>
              ) : (
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                  className="text-7xl mb-2"
                >
                  {test.emoji}
                </motion.div>
              )}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-900">
                {test.title}
              </h1>
              <p className="text-purple-600 font-semibold mt-2 leading-relaxed">
                {test.description}
              </p>
              <div className="flex justify-center gap-2 mt-3 flex-wrap text-xs font-bold">
                <span className="bg-purple-100 text-purple-700 rounded-full px-3 py-1">
                  📋 {test.questions.length} {t("questionsCount")}
                </span>
                {test.timeLimitMin > 0 && (
                  <span className="bg-orange-100 text-orange-700 rounded-full px-3 py-1">
                    ⏱️ {test.timeLimitMin} {t("minutes")}
                  </span>
                )}
                <span className="bg-teal-100 text-teal-700 rounded-full px-3 py-1">
                  👩‍🏫 {test.ownerName}
                </span>
                {test.institutionName && (
                  <span className="bg-cyan-100 text-cyan-900 border border-cyan-200 rounded-full px-3 py-1 font-extrabold flex items-center gap-1">
                    🏛️ {test.institutionName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    const url = `${window.location.origin}/?t=${test.slug}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(url);
                      alert(t("linkCopiedMsg"));
                    }
                  }}
                  className="bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 rounded-full px-3 py-1 transition flex items-center gap-1 cursor-pointer"
                >
                  {t("shareTest")}
                </button>
              </div>
            </div>

            {/* Accreditation */}
            {accredLines.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card-fun mt-6 p-5 sm:p-6 bg-gradient-to-br from-cyan-50 to-teal-50 !border-cyan-200"
              >
                <h3 className="font-extrabold text-cyan-900 text-lg flex items-center gap-2">
                  🛡️ {t("accreditationTitle")}
                </h3>
                <div className="mt-3 space-y-2">
                  {accredLines.map((line, i) => (
                    <p
                      key={i}
                      className={`text-sm leading-relaxed font-medium ${
                        i === accredLines.length - 1
                          ? "text-cyan-600 font-bold"
                          : "text-cyan-800/90"
                      }`}
                    >
                      {i === 0 && <span className="font-extrabold">{t("scientificBasis")}: </span>}
                      {line}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex justify-center mt-8 gap-4 flex-col sm:flex-row items-center">
              {user ? (
                <Button
                  onClick={submitAlreadyLoggedIn}
                  className="btn-fun bg-gradient-to-l from-orange-500 to-amber-400 text-white text-2xl px-14 py-7 h-auto"
                  style={{ ["--btn-fun-shadow" as string]: "#c2410c" }}
                >
                  الدخول للاختبار باسم {user.name}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    playClick();
                    setStep("auth");
                  }}
                  className="btn-fun bg-gradient-to-l from-orange-500 to-amber-400 text-white text-2xl px-14 py-7 h-auto"
                  style={{ ["--btn-fun-shadow" as string]: "#c2410c" }}
                >
                  {t("startNow")}
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-xl"
          >
            <div className="text-center mb-6">
              <motion.div
                animate={{ rotate: [0, -4, 4, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative w-24 h-24 mx-auto mb-3"
              >
                <Image
                  src="/images/mascot-welcome.png"
                  alt="البومة المعلمة"
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-900">
                {phoneState === "init" ? t("yourData") : 
                 phoneState === "not_found" ? "أهلاً بك معنا! 🎉" :
                 `مرحباً بعودتك، ${name.split(" ")[0]}!`}
              </h2>
              <p className="text-purple-600 mt-2 font-semibold">
                {phoneState === "init" ? t("yourDataDesc") : 
                 phoneState === "not_found" ? "يرجى استكمال بياناتك لإنشاء حسابك" :
                 phoneState === "exists_no_password" ? "يرجى إنشاء كلمة مرور لحسابك حتى تتمكن من الدخول لاحقاً" :
                 "يرجى إدخال كلمة المرور للمتابعة"}
              </p>
            </div>

            <div className="card-fun p-6 sm:p-8 space-y-5">
              {phoneState === "init" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-purple-900 font-bold text-base">{t("phoneLabel")}</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("phonePlaceholder")}
                      inputMode="tel"
                      dir="ltr"
                      className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50 text-right"
                    />
                    <p className="text-xs text-purple-600 font-bold bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      📱 اكتب رقمك المفعل على واتساب شاملاً المفتاح الدولي بدون 00 أو + (مثال الإمارات: <span dir="ltr" className="font-extrabold text-amber-900">971556503201</span>)
                    </p>
                    {errors.phone && <p className="text-red-500 text-sm font-semibold">{errors.phone}</p>}
                  </div>
                  <Button
                    onClick={checkPhone}
                    disabled={loading || !phone.trim()}
                    className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-xl py-6 h-auto"
                    style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
                  >
                    {loading ? "جاري التحقق..." : "التالي"}
                  </Button>
                </>
              )}

              {phoneState !== "init" && (
                <>
                  <div className="p-3 bg-purple-100 text-purple-900 font-bold rounded-xl flex justify-between items-center mb-4 border border-purple-200">
                    <span dir="ltr">{phone}</span>
                    <button 
                      onClick={() => setPhoneState("init")}
                      className="text-sm text-purple-600 hover:text-purple-800 bg-white px-3 py-1 rounded-lg"
                    >
                      تغيير الرقم
                    </button>
                  </div>

                  {phoneState === "not_found" && (
                    <div className="space-y-2">
                      <Label className="text-purple-900 font-bold text-base">{t("fullName")}</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50"
                      />
                      {errors.name && <p className="text-red-500 text-sm font-semibold">{errors.name}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-purple-900 font-bold text-base">
                      {phoneState === "exists_with_password" ? "كلمة المرور" : "أنشئ كلمة مرور لحسابك"}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50 pr-12 text-right"
                        dir="ltr"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-xl text-purple-400 hover:text-purple-600"
                      >
                        {showPassword ? "👁️‍🗨️" : "👁️"}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm font-semibold">{errors.password}</p>}
                  </div>

                  {phoneState === "not_found" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                      <div className="space-y-2">
                        <Label className="text-purple-900 font-bold text-base">{t("age")}</Label>
                        <Input
                          value={age}
                          onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                          placeholder="10"
                          inputMode="numeric"
                          className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50"
                        />
                        {errors.age && <p className="text-red-500 text-sm font-semibold">{errors.age}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-purple-900 font-bold text-base">{t("country")}</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger className="h-12 text-lg rounded-2xl border-2 border-purple-200 bg-purple-50/50">
                            <SelectValue placeholder={t("chooseCountry")} />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c} className="text-base">
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.country && (
                          <p className="text-red-500 text-sm font-semibold">{errors.country}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {errors.form && <p className="text-red-500 text-sm font-bold text-center mt-2">{errors.form}</p>}

                  <Button
                    onClick={submitAuth}
                    disabled={loading || !password}
                    className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-xl py-6 h-auto mt-4"
                    style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
                  >
                    {loading ? "جاري المعالجة..." : (phoneState === "not_found" ? "إكمال وبدء الاختبار" : "دخول وبدء الاختبار")}
                  </Button>
                </>
              )}

              <p className="text-center text-xs text-purple-400 font-semibold mt-4">
                {t("privacyNote")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
