"use client";

import { useState } from "react";
import { TrackerCard } from "@/components/tracker-card";
import type { Application } from "@/lib/me";
import { ENDED, PIPELINE, statusLabel } from "@/lib/tracker";

type Filter = "all" | (typeof PIPELINE)[number] | "ended";

// compact list with status chips; due follow-ups first, then most recently changed
export function TrackerList({ apps, today }: { apps: Application[]; today: string }) {
  const [filter, setFilter] = useState<Filter>("all");

  const inFilter = (a: Application, f: Filter) => f === "all" || (f === "ended" ? ENDED.includes(a.status) : a.status === f);
  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all" as Filter, label: "All", count: apps.length },
    ...PIPELINE.map((s) => ({ key: s as Filter, label: statusLabel[s], count: apps.filter((a) => a.status === s).length })),
    { key: "ended" as Filter, label: "Ended", count: apps.filter((a) => ENDED.includes(a.status)).length },
  ].filter((c) => c.key === "all" || c.count > 0);

  const isDue = (a: Application) => Boolean(a.follow_up_on && a.follow_up_on <= today && !ENDED.includes(a.status));
  const rows = apps
    .filter((a) => inFilter(a, filter))
    .sort((a, b) => Number(isDue(b)) - Number(isDue(a)) || b.updated_at.localeCompare(a.updated_at));

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Filter by status" className="flex gap-1.5 overflow-x-auto pb-1">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={filter === c.key}
            onClick={() => setFilter(c.key)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm ${filter === c.key ? "bg-nu-blue text-white" : "glass"}`}
          >
            {c.label}
            <span className={`tabular text-xs ${filter === c.key ? "text-white/75" : "text-ink-soft"}`}>{c.count}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="glass rounded-[22px] p-6 text-center text-sm text-ink-soft">Nothing here.</p>
      ) : (
        <ul className="glass divide-y divide-ink/8 overflow-hidden rounded-[22px]">
          {rows.map((a) => (
            <TrackerCard key={a.id} app={a} today={today} />
          ))}
        </ul>
      )}
    </div>
  );
}
