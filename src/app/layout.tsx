import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const baloo = Baloo_Bhaijaan_2({
  variable: "--font-baloo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "مغامرة المستوى | اختبار اللغة الإنجليزية التفاعلي",
  description:
    "اختبار تفاعلي ممتع لتحديد مستواك في اللغة الإنجليزية مع نجوم وشارات وصور مرحة، ونتيجة فورية بمستويات CEFR",
  keywords: [
    "اختبار مستوى",
    "اللغة الإنجليزية",
    "CEFR",
    "تعلم الإنجليزية",
    "English placement test",
  ],
  icons: {
    icon: "/images/mascot-welcome.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${baloo.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
