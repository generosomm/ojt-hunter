import type { Metadata } from "next";
import { Suspense } from "react";
import { MeTabs } from "@/components/me-tabs";

export const metadata: Metadata = {
  title: "Me",
  robots: { index: false, follow: false },
};

export default function MeLayout({ children }: LayoutProps<"/me">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-28 pt-6">
      <Suspense fallback={<div className="h-12" />}>
        <MeTabs />
      </Suspense>
      {children}
    </main>
  );
}
