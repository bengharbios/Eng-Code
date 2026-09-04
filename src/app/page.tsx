"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header";
import FunBackground from "@/components/quiz/FunBackground";
import HomeScreen from "@/components/student/HomeScreen";
import TakeTest from "@/components/student/TakeTest";
import StudentLookup from "@/components/student/StudentLookup";
import LoginView from "@/components/admin/LoginView";
import InstructorDashboard from "@/components/dashboard/InstructorDashboard";
import SuperDashboard from "@/components/dashboard/SuperDashboard";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/components/SessionProvider";

import TestsPage from "@/components/student/TestsPage";
import BottomNav from "@/components/BottomNav";

type View = "home" | "tests" | "take" | "student" | "login" | "instructor" | "super";

function AppShell() {
  const { user, loading: sessionLoading, logout } = useSession();
  const [view, setView] = useState<View>("home");
  const [takeSlug, setTakeSlug] = useState<string | null>(null);

  // Deep link: /?t=slug (works on any domain incl. Vercel)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("t");
    if (t) {
      // async to avoid synchronous setState in effect (hydration-safe)
      const id = requestAnimationFrame(() => {
        setTakeSlug(t);
        setView("take");
      });
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const goDashboard = useCallback(() => {
    if (!user) {
      setView("login");
      return;
    }
    if (user.role === "student") {
      setView("student");
      return;
    }
    setView(user.role === "super" ? "super" : "instructor");
  }, [user]);

  const openTake = useCallback((slug: string) => {
    window.history.replaceState(null, "", `/?t=${slug}`);
    setTakeSlug(slug);
    setView("take");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const goHome = useCallback(() => {
    window.history.replaceState(null, "", "/");
    setView("home");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((cfg) => {
        setSiteSettings(cfg || {});
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, []);

  // Show login gate or redirect to student lookup if trying to access staff dashboards
  const effectiveView: View =
    (view === "instructor" || view === "super") && (!user || user.role === "student")
      ? (user?.role === "student" ? "student" : "login")
      : view;

  // Auto-reset scroll position to top whenever view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [effectiveView]);

  const views: Record<View, React.ReactNode> = {
    home: (
      <HomeScreen
        onTake={openTake}
        onLogin={() => setView("login")}
        siteSettings={siteSettings}
        settingsLoaded={settingsLoaded}
      />
    ),
    tests: (
      <TestsPage
        onTake={openTake}
        onBack={goHome}
        siteSettings={siteSettings}
      />
    ),
    take: takeSlug ? (
      <TakeTest slug={takeSlug} onBack={goHome} siteSettings={siteSettings} />
    ) : null,
    student: <StudentLookup onBack={goHome} />,
    login: (
      <LoginView
        onBack={goHome}
        onSuccess={(role) => {
          if (role === "student") setView("student");
          else setView(role === "super" ? "super" : "instructor");
        }}
      />
    ),
    instructor: user && user.role === "instructor" ? <InstructorDashboard userName={user.name} /> : null,
    super: user && user.role === "super" ? <SuperDashboard userName={user.name} /> : null,
  };

  return (
    <main className="relative min-h-screen flex flex-col pb-20 sm:pb-0">
      <FunBackground />
      <Header
        onHome={goHome}
        onLogin={() => setView("login")}
        onStudent={() => setView("student")}
        onDashboard={goDashboard}
        siteSettings={siteSettings}
        settingsLoaded={settingsLoaded}
      />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveView + (takeSlug ?? "")}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
          >
            {views[effectiveView]}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mt-auto bg-purple-900 text-purple-200 py-4 px-4 mb-16 sm:mb-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm font-semibold">
          <span>
            🎓 {siteSettings.siteName || "مغامرة المستوى"} — منصة الاختبارات التعليمية التفاعلية × {siteSettings.instituteName || "معهد السلام الثقافي"}
          </span>
          <span>
            {siteSettings.footerText || (
              <>
                للتواصل الأكاديمي: <span dir="ltr">{siteSettings.contactPhone || "042899688"}</span> 📞
              </>
            )}
          </span>
        </div>
      </footer>

      <BottomNav
        currentView={effectiveView}
        onNavigate={(tab) => {
          if (tab === "home") {
            goHome();
          } else if (tab === "take") {
            setView("tests");
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          } else if (tab === "student") {
            setView("student");
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          } else if (tab === "login") {
            if (user) {
              logout();
              goHome();
            } else {
              setView("login");
              window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            }
          }
        }}
        isTakingTest={effectiveView === "take"}
      />
    </main>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </I18nProvider>
  );
}
