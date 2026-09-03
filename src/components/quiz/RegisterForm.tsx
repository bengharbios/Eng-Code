"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import { useToast } from "@/hooks/use-toast";
import { playClick } from "@/lib/sounds";

const COUNTRIES = [
  "الإمارات العربية المتحدة",
  "السعودية",
  "الكويت",
  "قطر",
  "عُمان",
  "البحرين",
  "مصر",
  "الأردن",
  "فلسطين",
  "لبنان",
  "سوريا",
  "العراق",
  "اليمن",
  "السودان",
  "ليبيا",
  "تونس",
  "الجزائر",
  "المغرب",
  "موريتانيا",
  "الصومال",
  "جيبوتي",
  "جزر القمر",
  "تركية",
  "أخرى",
];

export interface RegisterData {
  name: string;
  phone: string;
  age: string;
  country: string;
}

export default function RegisterForm({
  onSuccess,
}: {
  onSuccess: (id: string, name: string) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 3)
      e.name = "الرجاء كتابة الاسم الكامل";
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 7)
      e.phone = "الرجاء إدخال رقم هاتف صحيح مع رمز الدولة";
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 99)
      e.age = "الرجاء إدخال عمر صحيح (5 - 99)";
    if (!country) e.country = "الرجاء اختيار الدولة";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    playClick();
    if (!validate()) {
      toast({
        title: "بيانات ناقصة 📝",
        description: "أكمل الحقول المطلوبة أولاً من فضلك",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          age: parseInt(age, 10),
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ غير متوقع");
      onSuccess(data.id, name.trim());
    } catch (err) {
      toast({
        title: "تعذّر الحفظ 😅",
        description:
          err instanceof Error ? err.message : "تحقق من الاتصال وحاول مجدداً",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
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
            تعرّف علينا! 👋
          </h2>
          <p className="text-purple-600 mt-2 font-semibold">
            اكتب بياناتك لنعرف من أنت ونحفظ نتيجتك ونتواصل معك
          </p>
        </div>

        <div className="card-fun p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <Label className="text-purple-900 font-bold text-base">
              👦 الاسم الكامل
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد محمد"
              className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50"
            />
            {errors.name && (
              <p className="text-red-500 text-sm font-semibold">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-purple-900 font-bold text-base">
              📞 رقم الهاتف (مع رمز الدولة)
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: +971 50 123 4567"
              inputMode="tel"
              className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50 dir-ltr text-right"
              dir="ltr"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm font-semibold">
                {errors.phone}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-purple-900 font-bold text-base">
                🎂 العمر
              </Label>
              <Input
                value={age}
                onChange={(e) =>
                  setAge(e.target.value.replace(/\D/g, "").slice(0, 2))
                }
                placeholder="10"
                inputMode="numeric"
                className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50"
              />
              {errors.age && (
                <p className="text-red-500 text-sm font-semibold">{errors.age}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-purple-900 font-bold text-base">
                🌍 الدولة
              </Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50">
                  <SelectValue placeholder="اختر دولتك" />
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
                <p className="text-red-500 text-sm font-semibold">
                  {errors.country}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-xl py-6 h-auto"
            style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                جاري الحفظ...
              </span>
            ) : (
              "✅ تم! ابدأ المغامرة"
            )}
          </Button>

          <p className="text-center text-xs text-purple-400 font-semibold">
            🔒 بياناتك بأمان وتُستخدم فقط للتواصل معك بخصوص نتيجتك
          </p>
        </div>
      </motion.div>
    </div>
  );
}
