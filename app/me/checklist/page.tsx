import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChecklistRow } from "@/components/checklist-row";
import { SignInGate } from "@/components/sign-in-gate";
import { currentUser, getChecklist } from "@/lib/me";

export default function ChecklistPage({ searchParams }: PageProps<"/me/checklist">) {
  return (
    <Suspense fallback={<div className="glass h-64 animate-pulse rounded-[22px]" />}>
      <Checklist searchParams={searchParams} />
    </Suspense>
  );
}

async function Checklist({ searchParams }: Pick<PageProps<"/me/checklist">, "searchParams">) {
  await connection();
  const { userId } = await currentUser();
  if (!userId) return <SignInGate what="checklist" />;
  const nowOnly = (await searchParams).now === "1";
  const all = await getChecklist();
  const items = nowOnly ? all.filter((i) => i.template?.can_do_without_company) : all;
  const done = all.filter((i) => i.status === "done" || i.status === "na").length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Deployment checklist</h1>
          <p className="tabular mt-1 text-sm text-ink-soft">
            {done} of {all.length} done
          </p>
        </div>
        <nav aria-label="Filter" className="glass flex gap-1 rounded-full p-1">
          <Link href="/me/checklist" aria-current={!nowOnly ? "page" : undefined} className={`flex h-9 items-center rounded-full px-3.5 text-sm ${!nowOnly ? "bg-nu-blue text-white" : "text-ink-soft"}`}>
            All
          </Link>
          <Link href="/me/checklist?now=1" aria-current={nowOnly ? "page" : undefined} className={`flex h-9 items-center rounded-full px-3.5 text-sm ${nowOnly ? "bg-nu-blue text-white" : "text-ink-soft"}`}>
            Can do now
          </Link>
        </nav>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={done} aria-label="Checklist progress">
        <div className="h-full rounded-full bg-good transition-[width] duration-500" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} />
      </div>

      {items.length === 0 ? (
        <p className="glass rounded-[22px] p-6 text-center text-sm text-ink-soft">No checklist items yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <ChecklistRow key={item.item_key} item={item} />
          ))}
        </ul>
      )}
      <p className="px-1 text-xs text-ink-soft">Changing company sends you back to the pre-deployment checklist. Medical and I-THRIVE don&rsquo;t repeat, but signatures do.</p>
    </div>
  );
}
