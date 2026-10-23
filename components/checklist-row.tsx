"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { setChecklistStatus } from "@/app/me/actions";
import type { ChecklistItem } from "@/lib/me";

const statusText = { todo: "To do", in_progress: "Doing", done: "Done", na: "Not needed" } as const;
type Status = keyof typeof statusText;

export function ChecklistRow({ item }: { item: ChecklistItem }) {
  const [status, setStatus] = useOptimistic<Status>(item.status);
  const [, start] = useTransition();

  const change = (next: Status) =>
    start(async () => {
      setStatus(next);
      const res = await setChecklistStatus(item.item_key, next);
      if (!res.ok) toast.error(res.error);
    });

  const done = status === "done" || status === "na";
  return (
    <li className="glass flex items-center gap-3 rounded-[20px] p-3 pl-3.5">
      <button
        type="button"
        onClick={() => change(status === "done" ? "todo" : "done")}
        aria-label={status === "done" ? `Mark "${item.template?.label}" as not done` : `Mark "${item.template?.label}" as done`}
        aria-pressed={status === "done"}
        className={`grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          status === "done" ? "border-good bg-good text-white" : "border-ink/20"
        }`}
      >
        {status === "done" && <Check className="size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium leading-snug ${done ? "text-ink-soft line-through decoration-ink/30" : ""}`}>{item.template?.label}</p>
        {item.template?.can_do_without_company && !done && <p className="mt-0.5 text-xs text-good">Can do now</p>}
      </div>
      <label className="sr-only" htmlFor={`cl-${item.item_key}`}>Status</label>
      <select
        id={`cl-${item.item_key}`}
        value={status}
        onChange={(e) => change(e.target.value as Status)}
        className="glass h-9 shrink-0 rounded-full px-2.5 text-xs font-medium"
      >
        {(Object.keys(statusText) as Status[]).map((s) => (
          <option key={s} value={s}>{statusText[s]}</option>
        ))}
      </select>
    </li>
  );
}
