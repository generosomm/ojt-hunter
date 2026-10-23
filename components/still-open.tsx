"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CircleCheck, CircleX, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { reportOpenCheck } from "@/app/actions";

const answers = [
  { result: "opened_and_open", label: "Still open", icon: CircleCheck },
  { result: "opened_but_closed", label: "Closed", icon: CircleX },
  { result: "link_dead", label: "Link dead", icon: Link2Off },
] as const;

// a classmate opened the post: one tap says what they saw
export function StillOpen({ opportunityId, slug, signedIn }: { opportunityId: string; slug: string; signedIn: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  const report = (result: string) => {
    if (!signedIn) {
      toast("Sign in first to report.");
      return;
    }
    start(async () => {
      const res = await reportOpenCheck(opportunityId, result);
      if (res.ok) {
        setDone(true);
        toast.success("Thanks! Logged for everyone.");
      } else toast.error(res.error);
    });
  };

  return (
    <section className="glass flex flex-col gap-3 rounded-[22px] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium">{done ? "Thanks for checking." : "Opened the post? Is it still open?"}</p>
      {!done && (
        <div className="flex gap-1.5">
          {answers.map(({ result, label, icon: Icon }) => (
            <button
              key={result}
              type="button"
              disabled={pending}
              onClick={() => report(result)}
              className="glass flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm disabled:opacity-60 sm:flex-none"
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      )}
      <Link href={`/submit?role=${slug}`} className="shrink-0 text-xs text-ink-soft underline underline-offset-4">
        Report another update
      </Link>
    </section>
  );
}
