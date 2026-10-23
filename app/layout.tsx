import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { TopBar } from "@/components/top-bar";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "OJT Hunter", template: "%s | OJT Hunter" },
  description: "OJT openings with real pay, HTE status and how to apply, in one place.",
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
        <Toaster position="bottom-center" toastOptions={{ className: "glass-strong !text-ink !rounded-2xl" }} />
      </body>
    </html>
  );
}
