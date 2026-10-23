import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AddApplication } from "@/components/add-application";
import { SignInGate } from "@/components/sign-in-gate";
import { TrackerList } from "@/components/tracker-list";
import { getConfig } from "@/lib/data";
import { currentUser, getApplications, todayIn } from "@/lib/me";
import { ENDED } from "@/lib/tracker";

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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
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
        <TrackerList apps={apps} today={today} />
      )}
    </div>
  );
}
