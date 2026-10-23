import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Form tips",
  description: "Truthful answers for common OJT application form questions.",
};

export default function FormTipsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-28 pt-6">
      <header className="px-1 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Form tips</h1>
        <p className="mt-1 text-sm text-ink-soft">Answer truthfully. Recruiters check, and it&rsquo;s easy to explain the truth.</p>
      </header>
      <Suspense fallback={<div className="glass h-64 animate-pulse rounded-[22px]" />}>
        <Tips />
      </Suspense>
    </main>
  );
}

async function Tips() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.from("form_tips").select("id, question, answer").order("sort_order");
  if (error) throw new Error(`Could not load tips: ${error.message}`);
  if (!data?.length) return <p className="glass rounded-[22px] p-6 text-center text-sm text-ink-soft">No tips yet.</p>;
  return (
    <ul className="glass divide-y divide-ink/8 overflow-hidden rounded-[22px]">
      {data.map((t) => (
        <li key={t.id}>
          <details className="group px-4 py-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-medium marker:hidden">
              {t.question}
              <span aria-hidden className="text-ink-soft transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-2 text-sm leading-relaxed text-ink-soft">{t.answer}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
