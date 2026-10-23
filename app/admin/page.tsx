import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowUpRight, Upload } from "lucide-react";
import { ReviewButtons } from "@/components/review-buttons";
import { SignInGate } from "@/components/sign-in-gate";
import { adminSession, getQueue } from "@/lib/admin";
import { getConfig } from "@/lib/data";
import { dateText } from "@/lib/format";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const typeLabel: Record<string, string> = {
  new_opportunity: "New role",
  post_closed: "Post closed",
  allowance_confirmed: "Pay confirmed",
  hours_confirmed: "Hours confirmed",
  moa_clarification: "MOA info",
  email_bounced: "Email bounced",
  correction: "Correction",
};

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-28 pt-6">
      <Suspense fallback={<div className="glass h-64 animate-pulse rounded-[22px]" />}>
        <Queue />
      </Suspense>
    </main>
  );
}

async function Queue() {
  await connection();
  const { userId, isAdmin } = await adminSession();
  if (!userId) return <SignInGate what="admin page" />;
  if (!isAdmin) return <p className="glass rounded-[22px] p-8 text-center text-sm">This page is for admins.</p>;
  const [items, config] = await Promise.all([getQueue(), getConfig()]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Review queue</h1>
          <p className="tabular mt-1 text-sm text-ink-soft">{items.length} waiting</p>
        </div>
        <Link href="/admin/import" className="glass flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium">
          <Upload className="size-4" /> Import CSV
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="glass rounded-[22px] p-8 text-center text-sm text-ink-soft">Nothing to review.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((it) => (
            <li key={it.id} className="glass flex flex-col gap-3 rounded-[22px] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-ink-soft">
                    {typeLabel[it.type] ?? it.type}, {dateText(it.created_at, config.timezone)}
                  </p>
                  {it.role ? (
                    <Link href={`/opportunities/${it.role.slug}`} className="font-semibold underline-offset-4 hover:underline">
                      {it.role.company_name}: {it.role.title}
                    </Link>
                  ) : (
                    <p className="font-semibold">{typeLabel[it.type] ?? "Submission"}</p>
                  )}
                </div>
                <ReviewButtons id={it.id} />
              </div>

              <table className="w-full text-sm">
                <thead className="sr-only">
                  <tr><th>Field</th><th>Now</th><th>Proposed</th></tr>
                </thead>
                <tbody>
                  {it.rows.map((r) => (
                    <tr key={r.label} className="border-t border-ink/8 align-top">
                      <td className="w-24 py-1.5 pr-2 text-xs capitalize text-ink-soft">{r.label}</td>
                      <td className="py-1.5 pr-2 text-ink-soft line-through decoration-ink/25">{r.current}</td>
                      <td className="py-1.5 font-medium">{r.proposed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(it.evidence_url || it.evidence_note) && (
                <div className="rounded-2xl bg-ink/5 px-3 py-2 text-sm">
                  {it.evidence_note && <p className="text-ink-soft">{it.evidence_note}</p>}
                  {it.evidence_url && (
                    <a href={it.evidence_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-nu-blue underline underline-offset-4 dark:text-nu-gold">
                      Evidence <ArrowUpRight className="size-3.5 shrink-0" />
                    </a>
                  )}
                </div>
              )}
              <p className="text-xs text-ink-soft">
                {it.type === "new_opportunity"
                  ? "Approve adds it as a draft. Check the HTE list, then publish it from the role page."
                  : it.type === "post_closed" || it.type === "email_bounced"
                    ? "Approve applies the change and keeps the evidence."
                    : "Approve keeps it as evidence on the role. Update the role fields from the role page."}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
