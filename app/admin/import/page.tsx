import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CsvImport } from "@/components/csv-import";
import { SignInGate } from "@/components/sign-in-gate";
import { adminSession } from "@/lib/admin";
import { getConfig } from "@/lib/data";

export const metadata: Metadata = { title: "Import CSV", robots: { index: false, follow: false } };

export default function ImportPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-28 pt-6">
      <header className="flex items-end justify-between gap-3 px-1 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Import CSV</h1>
        <Link href="/admin" className="text-sm text-ink-soft underline underline-offset-4">Back to queue</Link>
      </header>
      <Suspense fallback={<div className="glass h-48 animate-pulse rounded-[22px]" />}>
        <Importer />
      </Suspense>
    </main>
  );
}

async function Importer() {
  await connection();
  const { userId, isAdmin } = await adminSession();
  if (!userId) return <SignInGate what="admin page" />;
  if (!isAdmin) return <p className="glass rounded-[22px] p-8 text-center text-sm">This page is for admins.</p>;
  const config = await getConfig();
  return <CsvImport currentVersion={config.hte_list_version} />;
}
