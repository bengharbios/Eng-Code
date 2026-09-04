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
  title: "منصة الاختبارات والتقييمات اللغوية | معهد السلام الثقافي",
  description:
    "المنصة الرسمية التفاعلية لاختبارات تحديد المستوى والتقييمات اللغوية في معهد السلام الثقافي وفق الإطار الأوروبي المرجعي (CEFR).",
  keywords: [
    "معهد السلام الثقافي",
    "اختبار تحديد المستوى",
    "اللغة الإنجليزية",
    "CEFR",
    "تعلم الإنجليزية",
    "English placement test",
  ],
  icons: {
    icon: "/images/institute-logo.webp",
    shortcut: "/images/institute-logo.webp",
    apple: "/images/institute-logo.webp",
  },
  openGraph: {
    title: "منصة الاختبارات والتقييمات اللغوية | معهد السلام الثقافي",
    description:
      "المنصة الرسمية التفاعلية لاختبارات تحديد المستوى والتقييمات اللغوية في معهد السلام الثقافي وفق الإطار الأوروبي المرجعي (CEFR).",
    url: "https://eng-code-beige.vercel.app",
    siteName: "معهد السلام الثقافي",
    images: [
      {
        url: "https://eng-code-beige.vercel.app/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "منصة الاختبارات - معهد السلام الثقافي",
      },
      {
        url: "https://eng-code-beige.vercel.app/images/institute-logo.webp",
        width: 500,
        height: 500,
        alt: "شعار معهد السلام الثقافي",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة الاختبارات والتقييمات اللغوية | معهد السلام الثقافي",
    description:
      "المنصة الرسمية التفاعلية لاختبارات تحديد المستوى والتقييمات اللغوية في معهد السلام الثقافي.",
    images: ["https://eng-code-beige.vercel.app/images/og-share.png"],
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
