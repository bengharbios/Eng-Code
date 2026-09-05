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

  const [phoneState, setPhoneState] = useState<"init" | "not_found" | "exists_with_password" | "exists_no_password">("init");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (user && user.role === "student") {
    return <StudentPortal onBack={onBack} />;
  }

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

  const submitAuth = async () => {
    playClick();
    const e: Record<string, string> = {};
    if (!password) e.password = "كلمة المرور مطلوبة";
    if (phoneState === "not_found" && (!name.trim() || name.trim().length < 3)) e.name = t("fullRequired");

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
          mode: phoneState === "not_found" ? "register" : "login",
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
        else if (data.error === "not_found") setErrors({ form: "الرقم غير مسجل" });
        else if (data.error === "already_exists") setErrors({ form: "الرقم مسجل مسبقاً" });
        else setErrors({ form: "حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى." });
        return;
      }

      await refresh();
    } catch (err) {
      setErrors({ form: "تعذر الاتصال بالخادم." });
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
            {phoneState === "init" ? "بوابة الطالب" :
             phoneState === "not_found" ? "أهلاً بك معنا! 🎉" :
             `مرحباً بعودتك، ${name.split(" ")[0]}!`}
          </h2>
          <p className="text-purple-600 mt-2 font-semibold">
            {phoneState === "init" ? "قم بتسجيل الدخول للاطلاع على نتائج اختباراتك السابقة" :
             phoneState === "not_found" ? "أدخل بياناتك لإنشاء حسابك" :
             phoneState === "exists_no_password" ? "أنشئ كلمة مرور لحسابك حتى تتمكن من الدخول لاحقاً" :
             "أدخل كلمة المرور للمتابعة"}
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
                  onKeyDown={(e) => e.key === "Enter" && checkPhone()}
                  placeholder={t("phonePlaceholder")}
                  inputMode="tel"
                  dir="ltr"
                  className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50 text-right"
                />
                {errors.phone && <p className="text-red-500 text-sm font-semibold">{errors.phone}</p>}
              </div>
              <Button
                onClick={checkPhone}
                disabled={loading || !phone.trim()}
                className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-xl py-6 h-auto mt-4"
                style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
              >
                {loading ? "جاري التحقق..." : "التالي ←"}
              </Button>
            </>
          )}

          {phoneState !== "init" && (
            <>
              <div className="p-3 bg-purple-100 text-purple-900 font-bold rounded-xl flex justify-between items-center border border-purple-200">
                <span dir="ltr">{phone}</span>
                <button
                  onClick={() => { setPhoneState("init"); setPassword(""); setErrors({}); }}
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
                    onKeyDown={(e) => e.key === "Enter" && submitAuth()}
                    className="h-12 text-lg rounded-2xl border-2 border-purple-200 focus-visible:ring-purple-400 bg-purple-50/50 pl-12 text-right"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-xl text-purple-400 hover:text-purple-600"
                  >
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm font-semibold">{errors.password}</p>}
                {phoneState === "exists_with_password" && (
                  <button
                    type="button"
                    onClick={() => alert(t("forgotPwMsg"))}
                    className="text-sm text-purple-400 hover:text-purple-600 font-semibold mt-1 text-right w-full"
                  >
                    {t("forgotPwBtn")}
                  </button>
                )}
              </div>

              {errors.form && <p className="text-red-500 text-sm font-bold text-center">{errors.form}</p>}

              <Button
                onClick={submitAuth}
                disabled={loading || !password}
                className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white text-xl py-6 h-auto mt-2"
                style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
              >
                {loading ? "جاري الدخول..." : (phoneState === "not_found" ? "إنشاء الحساب" : "تسجيل الدخول")}
              </Button>
            </>
          )}
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
