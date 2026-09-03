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

const COUNTRIES = [
  "الإمارات العربية المتحدة", "السعودية", "الكويت", "قطر", "عُمان", "البحرين",
  "مصر", "الأردن", "فلسطين", "لبنان", "سوريا", "العراق", "اليمن", "السودان",
  "ليبيا", "تونس", "الجزائر", "المغرب", "موريتانيا", "الصومال", "جيبوتي",
  "جزر القمر", "تركية", "أخرى",
];

// ===== Intro + Registration steps; quiz & result are rendered by parent =====
export default function TakeTestIntro({
  test,
  onBegin,
}: {
  test: PublicTest;
  onBegin: (info: StudentRegInfo) => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState<"intro" | "register">("intro");

  // ===== Registration =====
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const qDir = useMemo(() => (isRtlLang(test.language) ? "rtl" : "ltr"), [test.language]);
  const accredLines = test.accreditation
    ? test.accreditation.split("\n").filter(Boolean)
    : [];

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 3) e.name = t("fullRequired");
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 7) e.phone = t("validPhone");
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 99) e.age = t("validAge");
    if (!country) e.country = t("chooseCountryErr");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    playClick();
    if (!validate()) return;
    onBegin({ name: name.trim(), phone: phone.trim(), age, country });
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
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="text-7xl mb-2"
              >
                {test.emoji}
              </motion.div>
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

            <div className="flex justify-center mt-8">
              <Button
                onClick={() => {
                  playClick();
                  setStep("register");
                }}
                className="btn-fun bg-gradient-to-l from-orange-500 to-amber-400 text-white text-2xl px-14 py-7 h-auto"
                style={{ ["--btn-fun-shadow" as string]: "#c2410c" }}
              >
                {t("startNow")}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="register"
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
                {t("yourData")}
              </h2>
              <p className="text-purple-600 mt-2 font-semibold">{t("yourDataDesc")}</p>
            </div>

            <div className="card-fun p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-purple-900 font-bold text-base">{t("fullName")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50"
                />
                {errors.name && <p className="text-red-500 text-sm font-semibold">{errors.name}</p>}
              </div>

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
                {errors.phone && <p className="text-red-500 text-sm font-semibold">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

              <Button
                onClick={submit}
                className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-xl py-6 h-auto"
                style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
              >
                {t("doneStart")}
              </Button>

              <p className="text-center text-xs text-purple-400 font-semibold">
                {t("privacyNote")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
