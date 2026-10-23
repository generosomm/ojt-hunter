import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { Dock } from "@/components/dock";
import { TopBar } from "@/components/top-bar";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin"] });

// Vercel sets the production domain; locally previews resolve against localhost
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "OJT Hunter", template: "%s | OJT Hunter" },
  description: "OJT openings with real pay, HTE status and how to apply, in one place.",
  openGraph: { siteName: "OJT Hunter", type: "website", locale: "en_PH" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9edf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1030" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${onest.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Suspense fallback={<div className="h-16" />}>
          <TopBar />
        </Suspense>
        {children}
        <Suspense fallback={null}>
          <Dock />
        </Suspense>
        {/* cookieless page-view counts only; see /privacy */}
        <Analytics />
        <Toaster position="top-center"toastOptions={{ className: "glass-strong !text-ink !rounded-2xl" }} />
      </body>
    </html>
  );
}
