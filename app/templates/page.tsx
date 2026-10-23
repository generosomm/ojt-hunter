import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { MeTabs } from "@/components/me-tabs";
import { TemplateStudio } from "@/components/template-studio";
import { getStudioData } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Email templates",
  description: "Application, follow-up and MOA emails filled from your profile. Edit, copy, send.",
};

export default function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-28 pt-6">
      <Suspense fallback={<div className="h-12" />}>
        <MeTabs />
      </Suspense>
      <header className="px-1 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
      </header>
      <Suspense fallback={<div className="glass h-96 animate-pulse rounded-[22px]" />}>
        <Studio searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

async function Studio({ searchParams }: Pick<PageProps<"/templates">, "searchParams">) {
  await connection();
  const sp = await searchParams;
  const roleSlug = one(sp.role)?.replace(/[^a-z0-9-]/g, "") || null;
  const data = await getStudioData(roleSlug);
  const t = one(sp.t);
  const templateKey = data.templates.some((x) => x.key === t) ? t! : (data.templates[0]?.key ?? "");
  return <TemplateStudio {...data} templateKey={templateKey} />;
}
