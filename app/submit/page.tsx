import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignInGate } from "@/components/sign-in-gate";
import { SubmitForm } from "@/components/submit-form";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/me";

export const metadata: Metadata = {
  title: "Share an update",
  description: "Report a closed post, confirmed pay, a bounced email, or a new OJT role.",
  robots: { index: false, follow: false },
};

export default function SubmitPage({ searchParams }: PageProps<"/submit">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-28 pt-6">
      <header className="px-1 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Share an update</h1>
        <p className="mt-1 text-sm text-ink-soft">An admin checks it before anything changes.</p>
      </header>
      <Suspense fallback={<div className="glass h-96 animate-pulse rounded-[22px]" />}>
        <Submit searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Submit({ searchParams }: Pick<PageProps<"/submit">, "searchParams">) {
  await connection();
  const { userId } = await currentUser();
  if (!userId) return <SignInGate what="update form" />;
  const raw = (await searchParams).role;
  const initialRole = (Array.isArray(raw) ? raw[0] : raw)?.replace(/[^a-z0-9-]/g, "") || null;
  const supabase = await createClient();
  const { data } = await supabase.from("opportunity_listing").select("slug, title, company_name").eq("is_published", true).order("company_name");
  const roles = (data ?? []).map((r) => ({ slug: r.slug as string, label: `${r.company_name} - ${r.title}` }));
  return <SubmitForm roles={roles} initialRole={roles.some((r) => r.slug === initialRole) ? initialRole : null} />;
}
