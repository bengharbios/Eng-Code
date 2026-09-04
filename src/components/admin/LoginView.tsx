"use client";

import { useState } from "react";
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
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/components/SessionProvider";
import { playClick } from "@/lib/sounds";

const COUNTRIES = [
  "الإمارات العربية المتحدة", "السعودية", "الكويت", "قطر", "عُمان", "البحرين",
  "مصر", "الأردن", "فلسطين", "لبنان", "سوريا", "العراق", "اليمن", "السودان",
  "ليبيا", "تونس", "الجزائر", "المغرب", "موريتانيا", "الصومال", "جيبوتي",
  "جزر القمر", "تركية", "أخرى",
];

export default function LoginView({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (role: "super" | "instructor" | "student") => void;
}) {
  const { t } = useI18n();
  const { refresh } = useSession();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regCountry, setRegCountry] = useState("");

  const submitLogin = async () => {
    playClick();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        setError("بيانات الدخول غير صحيحة، أو الرقم غير مسجل");
        return;
      }
      const data = await res.json();
      await refresh();
      onSuccess(data.user.role);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    playClick();
    setError("");
    if (!regName.trim() || regName.trim().length < 3) {
      setError("الاسم الكامل مطلوب (3 أحرف على الأقل)");
      return;
    }
    if (!regPhone.trim() || regPhone.trim().length < 7) {
      setError("رقم الهاتف غير صحيح");
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setError("كلمة المرور يجب أن تكون 4 خانات على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "register",
          phone: regPhone.trim(),
          password: regPassword,
          name: regName.trim(),
          age: regAge || "0",
          country: regCountry || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "already_exists") setError("رقم الهاتف مسجل مسبقاً، يرجى تسجيل الدخول");
        else setError("حدث خطأ أثناء إنشاء الحساب");
        return;
      }
      await refresh();
      onSuccess("student");
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-fun p-6 sm:p-8 w-full max-w-md text-center"
      >
        <div className="text-5xl mb-2">🔑</div>
        <h2 className="text-2xl font-extrabold text-purple-900 mb-4">تسجيل الدخول</h2>

        {/* Tab Selector */}
        <div className="flex bg-purple-100 p-1 rounded-2xl mb-6 font-bold text-sm">
          <button
            type="button"
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl transition ${
              tab === "login"
                ? "bg-white text-purple-900 shadow"
                : "text-purple-600 hover:text-purple-900"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl transition ${
              tab === "register"
                ? "bg-white text-purple-900 shadow"
                : "text-purple-600 hover:text-purple-900"
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {tab === "login" ? (
          <div className="space-y-4 text-right">
            <div className="space-y-2">
              <Label className="text-purple-900 font-bold">رقم الهاتف أو اسم المستخدم</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitLogin()}
                dir="ltr"
                className="h-12 rounded-2xl border-2 border-purple-200 text-right font-semibold"
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-purple-900 font-bold">{t("password")}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitLogin()}
                dir="ltr"
                className="h-12 rounded-2xl border-2 border-purple-200 text-right"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-2.5 rounded-xl border border-red-200">
                {error}
              </p>
            )}
            <Button
              onClick={submitLogin}
              disabled={loading}
              className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white text-lg py-5 h-auto"
              style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
            >
              {loading ? t("signingIn") : t("signIn")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-right">
            <div className="space-y-2">
              <Label className="text-purple-900 font-bold">الاسم الكامل</Label>
              <Input
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="h-12 rounded-2xl border-2 border-purple-200 text-right font-semibold"
                placeholder="أدخل اسمك الثلاثي"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-purple-900 font-bold">رقم الهاتف (واتساب)</Label>
              <Input
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                dir="ltr"
                className="h-12 rounded-2xl border-2 border-purple-200 text-right font-semibold"
                placeholder="971501234567"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-purple-900 font-bold">كلمة المرور</Label>
              <Input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                dir="ltr"
                className="h-12 rounded-2xl border-2 border-purple-200 text-right"
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-purple-900 font-bold">العمر</Label>
                <Input
                  value={regAge}
                  onChange={(e) => setRegAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="22"
                  className="h-12 rounded-2xl border-2 border-purple-200 text-right"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-purple-900 font-bold">الدولة</Label>
                <Select value={regCountry} onValueChange={setRegCountry}>
                  <SelectTrigger className="h-12 rounded-2xl border-2 border-purple-200 bg-white">
                    <SelectValue placeholder="اختر الدولة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-2.5 rounded-xl border border-red-200">
                {error}
              </p>
            )}

            <Button
              onClick={submitRegister}
              disabled={loading}
              className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white text-lg py-5 h-auto"
              style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب طالب"}
            </Button>
          </div>
        )}

        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full text-purple-500 font-bold rounded-full mt-4"
        >
          {t("backHome")}
        </Button>
      </motion.div>
    </div>
  );
}
