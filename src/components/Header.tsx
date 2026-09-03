"use client";

import Image from "next/image";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { useSession } from "@/components/SessionProvider";
import { playClick } from "@/lib/sounds";

export default function Header({
  onHome,
  onLogin,
  onStudent,
  onDashboard,
}: {
  onHome: () => void;
  onLogin: () => void;
  onStudent: () => void;
  onDashboard: () => void;
}) {
  const { lang, setLang, t } = useI18n();
  const { user, logout } = useSession();

  return (
    <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md border-b-2 border-purple-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <button onClick={onHome} className="flex items-center gap-2 group shrink-0">
          <span className="text-3xl group-hover:scale-110 transition-transform">🦉</span>
          <div className="text-right leading-tight hidden sm:block">
            <div className="font-extrabold text-lg text-purple-900">{t("appName")}</div>
            <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
              <Image
                src="/images/institute-logo.webp"
                alt="معهد السلام التثقافي"
                width={14}
                height={14}
                className="rounded-sm object-contain"
              />
              معهد السلام التثقافي
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <select
            value={lang}
            onChange={(e) => {
              playClick();
              setLang(e.target.value as typeof lang);
            }}
            aria-label={t("langLabel")}
            className="h-9 rounded-full border-2 border-purple-200 bg-white text-sm font-bold text-purple-700 px-2 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              playClick();
              onStudent();
            }}
            className="rounded-full bg-amber-100 border-2 border-amber-300 text-amber-800 font-bold text-sm px-3.5 py-1.5 hover:scale-105 transition-transform"
          >
            {t("myResults")}
          </button>

          {user ? (
            <>
              <button
                onClick={() => {
                  playClick();
                  onDashboard();
                }}
                className="rounded-full bg-purple-100 border-2 border-purple-300 text-purple-800 font-bold text-sm px-3.5 py-1.5 hover:scale-105 transition-transform"
              >
                📊 {t("dashboard")}
              </button>
              <button
                onClick={() => logout()}
                title={user.name}
                className="rounded-full bg-white border-2 border-purple-200 text-purple-500 font-bold text-sm px-3 py-1.5 hover:bg-purple-50"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                playClick();
                onLogin();
              }}
              className="rounded-full bg-purple-600 border-2 border-purple-700 text-white font-bold text-sm px-4 py-1.5 hover:scale-105 transition-transform shadow"
            >
              {t("login")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
