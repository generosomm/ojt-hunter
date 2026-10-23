import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "@/components/badge";
import { MoaSupportButton } from "@/components/moa-support-button";
import { getConfig, getMoaBoard, getViewer } from "@/lib/data";
import { dateText } from "@/lib/format";
import type { Tone } from "@/lib/labels";

export const metadata: Metadata = {
  title: "MOA board",
  description: "Companies classmates asked the school to partner with, and how many need each one.",
};

const statusText: Record<string, { label: string; tone: Tone }> = {
  requested: { label: "Requested", tone: "warn" },
  in_progress: { label: "In progress", tone: "warn" },
  approved: { label: "Approved", tone: "good" },
  rejected: { label: "Not approved", tone: "bad" },
  unknown: { label: "Status unknown", tone: "muted" },
};

export default function MoaBoardPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-28 pt-6">
      <header className="px-1 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">MOA board</h1>
        <p className="mt-1 text-sm text-ink-soft">New partnerships classmates are waiting on.</p>
      </header>
      <Suspense fallback={<div className="glass h-40 animate-pulse rounded-[22px]" />}>
        <Board />
      </Suspense>
    </main>
  );
}

async function Board() {
  await connection();
  const config = await getConfig();
  const viewer = await getViewer(config);
  const rows = await getMoaBoard(viewer.userId);

  if (rows.length === 0) {
    return (
      <div className="glass rounded-[22px] p-8 text-center">
        <p className="font-medium">No MOA requests yet.</p>
        <p className="mt-1 text-sm text-ink-soft">
          Need one? Ask your FIC, then <Link href="/partnership-checker" className="underline underline-offset-4">check the HTE list</Link> first.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => {
        const s = statusText[r.status] ?? statusText.unknown;
        return (
          <li key={r.id} className="glass flex flex-col gap-3 rounded-[22px] p-5">
            <div className="flex items-start justify-between gap-3">
              {r.company ? (
                <Link href={`/companies/${r.company.slug}`} className="text-lg font-semibold underline-offset-4 hover:underline">
                  {r.company.name}
                </Link>
              ) : (
                <span className="text-lg font-semibold">Company</span>
              )}
              <Badge tone={s.tone}>{s.label}</Badge>
            </div>
            <p className="text-sm text-ink-soft">
              {r.requested_on ? `Requested ${dateText(r.requested_on, config.timezone)}` : "Request date unknown"}
              {r.requested_via ? ` via ${r.requested_via}` : ""}
            </p>
            {r.notes && <p className="text-sm text-ink-soft">{r.notes}</p>}
            <div>
              <MoaSupportButton requestId={r.id} mine={r.mine} count={r.supporters} signedIn={Boolean(viewer.userId)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
