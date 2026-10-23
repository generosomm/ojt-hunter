import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AddApplication } from "@/components/add-application";
import { SignInGate } from "@/components/sign-in-gate";
import { TrackerCard } from "@/components/tracker-card";
import { getConfig } from "@/lib/data";
import { currentUser, getApplications, todayIn, type Application } from "@/lib/me";
import { ENDED, PIPELINE, statusLabel } from "@/lib/tracker";

export default function TrackerPage() {
  return (
    <Suspense fallback={<div className="glass h-64 animate-pulse rounded-[22px]" />}>
      <Tracker />
    </Suspense>
  );
}

async function Tracker() {
  await connection();
  const { userId } = await currentUser();
  if (!userId) return <SignInGate what="tracker" />;
  const [apps, config] = await Promise.all([getApplications(), getConfig()]);
  const today = todayIn(config.timezone);
  const due = apps.filter((a) => a.follow_up_on && a.follow_up_on <= today && !ENDED.includes(a.status) && a.status !== "accepted");

  const columns: { key: string; title: string; items: Application[] }[] = [
    ...PIPELINE.map((s) => ({ key: s, title: statusLabel[s], items: apps.filter((a) => a.status === s) })),
    { key: "ended", title: "Ended", items: apps.filter((a) => ENDED.includes(a.status)) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Tracker</h1>
        <AddApplication />
      </div>

      {due.length > 0 && (
        <p className="rounded-2xl bg-nu-gold/20 px-4 py-3 text-sm font-medium" role="status">
          {due.length === 1 ? "1 follow-up is due." : `${due.length} follow-ups are due.`} Reply in the same email thread.
        </p>
      )}

      {apps.length === 0 ? (
        <div className="glass rounded-[22px] p-8 text-center">
          <p className="font-medium">Nothing tracked yet.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Tap <span className="font-medium">Save to tracker</span> on any <Link href="/" className="underline underline-offset-4">role</Link>, or add a company above.
          </p>
        </div>
      ) : (
        // phone: stacked groups (empty ones hidden).
        // desktop: the board is one screen tall and ends above the dock, each column scrolls on its own,
        // so the sideways scrollbar stays in view instead of sitting under a long column. Padding keeps focus rings unclipped.
        <div className="flex flex-col gap-5 lg:h-[max(28rem,calc(100dvh-22rem))] lg:snap-x lg:flex-row lg:gap-3 lg:overflow-x-auto lg:p-1 lg:pb-3">
          {columns.map((col) => (
            <section
              key={col.key}
              aria-label={col.title}
              className={`flex shrink-0 flex-col gap-2.5 lg:min-h-0 lg:w-72 lg:snap-start ${col.items.length === 0 ? "hidden lg:flex" : ""}`}
            >
              <h2 className="flex items-center gap-2 px-1 text-sm font-semibold">
                {col.title}
                <span className="tabular rounded-full bg-ink/8 px-2 text-xs text-ink-soft">{col.items.length}</span>
              </h2>
              <div className="flex flex-col gap-2.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:p-1">
                {col.items.map((a) => (
                  <TrackerCard key={a.id} app={a} today={today} />
                ))}
                {col.items.length === 0 && <div className="hidden h-20 shrink-0 rounded-[20px] border border-dashed border-ink/15 lg:block" />}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
