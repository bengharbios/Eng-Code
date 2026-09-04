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
  siteSettings = {},
  settingsLoaded = true,
}: {
  onHome: () => void;
  onLogin: () => void;
  onStudent: () => void;
  onDashboard: () => void;
  siteSettings?: Record<string, string>;
  settingsLoaded?: boolean;
}) {
  const { lang, setLang, t } = useI18n();
  const { user, logout } = useSession();

  const logoUrl = siteSettings.logoUrl;
  const siteName = siteSettings.siteName || t("appName");
  const instituteName = siteSettings.instituteName || "معهد السلام الثقافي";

  return (
    <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md border-b-2 border-purple-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <button onClick={onHome} className="flex items-center gap-2 group shrink-0">
          {!settingsLoaded ? (
            <div className="w-10 h-10 rounded-lg bg-purple-100 animate-pulse" />
          ) : logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={instituteName}
              className="w-10 h-10 object-contain rounded-lg border border-purple-200 bg-white p-0.5 group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="text-3xl group-hover:scale-110 transition-transform">🎓</span>
          )}
          <div className="text-right leading-tight hidden sm:block">
            {!settingsLoaded ? (
              <div className="space-y-1">
                <div className="w-28 h-4 bg-purple-100 rounded animate-pulse" />
                <div className="w-20 h-3 bg-purple-100 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="font-extrabold text-lg text-purple-900">{siteName}</div>
                <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                  {logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={logoUrl}
                      alt={instituteName}
                      className="w-3.5 h-3.5 rounded-sm object-contain"
                    />
                  ) : (
                    <span>🎓</span>
                  )}
                  {instituteName}
                </div>
              </>
            )}
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
