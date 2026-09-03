"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/components/SessionProvider";
import { playClick } from "@/lib/sounds";

export default function LoginView({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (role: "super" | "instructor") => void;
}) {
  const { t } = useI18n();
  const { refresh } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
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
        setError(t("badCredentials"));
        return;
      }
      const data = await res.json();
      await refresh();
      onSuccess(data.user.role);
    } catch {
      setError(t("badCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-fun p-8 w-full max-w-sm text-center"
      >
        <div className="text-6xl mb-3">🔐</div>
        <h2 className="text-2xl font-extrabold text-purple-900">{t("loginTitle")}</h2>
        <p className="text-purple-500 font-semibold text-sm mt-1 mb-5">
          {t("loginDesc")}
        </p>
        <div className="space-y-4 text-right">
          <div className="space-y-2">
            <Label className="text-purple-900 font-bold">{t("username")}</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              dir="ltr"
              className="h-12 rounded-2xl border-2 border-purple-200 text-left"
              placeholder="super | duaa | ridha | ..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-purple-900 font-bold">{t("password")}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              dir="ltr"
              className="h-12 rounded-2xl border-2 border-purple-200 text-left"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm font-bold text-center">{error}</p>
          )}
          <Button
            onClick={submit}
            disabled={loading}
            className="btn-fun w-full bg-gradient-to-l from-purple-600 to-fuchsia-500 text-white text-lg py-5 h-auto"
            style={{ ["--btn-fun-shadow" as string]: "#6b21a8" }}
          >
            {loading ? t("signingIn") : t("signIn")}
          </Button>
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full text-purple-500 font-bold rounded-full"
          >
            {t("backHome")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
