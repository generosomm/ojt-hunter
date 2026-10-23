import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Ban } from "lucide-react";
import { Badge } from "@/components/badge";
import { CopyButton } from "@/components/copy-button";
import { getColdEmails } from "@/lib/data";
import type { Contact } from "@/lib/types";

export const metadata: Metadata = {
  title: "HR emails",
  description: "Company-published HR emails, and the ones that bounced.",
};

const purposeText: Record<Contact["purpose"], string> = {
  resume_intake: "Takes resumes",
  questions_only: "Questions only",
  help_desk: "Help desk",
  unknown: "Purpose unclear",
};

export default function ColdEmailsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-28 pt-6">
      <header className="px-1 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">HR emails</h1>
        <p className="mt-1 text-sm text-ink-soft">Only addresses companies published. Never guess one like hr@company.com.</p>
      </header>
      <Suspense fallback={<div className="glass h-60 animate-pulse rounded-[22px]" />}>
        <Emails />
      </Suspense>
    </main>
  );
}

async function Emails() {
  await connection();
  const { usable, avoid } = await getColdEmails();

  return (
    <>
      {usable.length === 0 ? (
        <p className="glass rounded-[22px] p-6 text-center text-sm text-ink-soft">No emails yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {usable.map((c) => (
            <li key={c.id} className="glass flex items-center gap-3 rounded-[22px] p-4">
              <div className="min-w-0 flex-1">
                {c.company && (
                  <Link href={`/companies/${c.company.slug}`} className="text-sm text-ink-soft underline-offset-4 hover:underline">
                    {c.company.name}
                  </Link>
                )}
                <p className="truncate font-medium">{c.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone={c.status === "reply_received" ? "good" : "muted"}>{c.status === "reply_received" ? "Has replied" : "Not tested"}</Badge>
                  <Badge tone={c.purpose === "resume_intake" ? "good" : "warn"}>{purposeText[c.purpose]}</Badge>
                </div>
                {c.notes && <p className="mt-1.5 text-xs text-ink-soft">{c.notes}</p>}
              </div>
              <CopyButton value={c.email} label={`Copy ${c.email}`} />
            </li>
          ))}
        </ul>
      )}

      {avoid.length > 0 && (
        <section className="rounded-[22px] bg-bad/8 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-bad">
            <Ban className="size-4" /> Do not use
          </h2>
          <ul className="flex flex-col gap-3 text-sm">
            {avoid.map((c) => (
              <li key={c.id}>
                {c.company && <span className="block text-xs text-ink-soft">{c.company.name}</span>}
                <span className="break-all line-through decoration-bad/60">{c.email}</span>
                <span className="block text-xs text-ink-soft">
                  {c.status === "bounced" ? `Bounced${c.bounce_code ? ` (${c.bounce_code})` : ""}` : purposeText[c.purpose]}
                  {c.notes ? `. ${c.notes}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
