"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { playClick } from "@/lib/sounds";
import { useSession } from "@/components/SessionProvider";
import StudentPortal from "./StudentPortal";

export default function StudentLookup({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { user, refresh } = useSession();
  
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (user && user.role === "student") {
    return <StudentPortal onBack={onBack} />;
  }

  const submitAuth = async () => {
    playClick();
    const e: Record<string, string> = {};
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 7) e.phone = t("validPhone");
    if (!password) e.password = "كلمة المرور مطلوبة";
    if (authMode === "register" && (!name.trim() || name.trim().length < 3)) e.name = t("fullRequired");
    
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: authMode,
          phone: phone.trim(),
          password,
          name: name.trim(),
          age: "0",
          country: "أخرى"
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === "invalid_password") setErrors({ password: "كلمة المرور غير صحيحة" });
        else if (data.error === "not_found") setErrors({ phone: "رقم الهاتف غير مسجل. الرجاء إنشاء حساب جديد." });
        else if (data.error === "already_exists") setErrors({ phone: "رقم الهاتف مسجل مسبقاً. الرجاء تسجيل الدخول." });
        else setErrors({ phone: "حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى." });
        return;
      }
      
      await refresh();
    } catch (err) {
      setErrors({ phone: "تعذر الاتصال بالخادم." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-6">
          <span className="text-6xl">🎒</span>
          <h2 className="text-3xl font-extrabold text-purple-900 mt-2">
            بوابة الطالب
          </h2>
          <p className="text-purple-600 mt-2 font-semibold">قم بتسجيل الدخول للاطلاع على نتائج اختباراتك السابقة</p>
        </div>

        <div className="card-fun p-6 sm:p-8 space-y-5">
          <div className="flex bg-purple-100 rounded-2xl p-1 mb-4">
            <button
              onClick={() => { setAuthMode("login"); setErrors({}); }}
              className={`flex-1 py-3 text-lg font-bold rounded-xl transition-all ${authMode === "login" ? "bg-white text-purple-900 shadow-sm" : "text-purple-500 hover:bg-purple-200/50"}`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setAuthMode("register"); setErrors({}); }}
              className={`flex-1 py-3 text-lg font-bold rounded-xl transition-all ${authMode === "register" ? "bg-white text-purple-900 shadow-sm" : "text-purple-500 hover:bg-purple-200/50"}`}
            >
              حساب جديد
            </button>
          </div>

          {authMode === "register" && (
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

          <div className="space-y-2">
            <Label className="text-purple-900 font-bold text-base">كلمة المرور</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50 text-right"
            />
            {errors.password && <p className="text-red-500 text-sm font-semibold">{errors.password}</p>}
          </div>

          <Button
            onClick={submitAuth}
            disabled={loading}
            className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-xl py-6 h-auto mt-4"
            style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
          >
            {loading ? "جاري الدخول..." : (authMode === "register" ? "إنشاء الحساب" : "تسجيل الدخول")}
          </Button>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-purple-500 font-bold rounded-full"
          >
            {t("backHome")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
