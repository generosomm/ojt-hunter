"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Bookmark, BookmarkCheck, CircleCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { markRoleApplied, saveRoleToTracker } from "@/app/me/actions";
import type { ApplicationStatus } from "@/lib/schemas";
import { statusLabel } from "@/lib/tracker";

const pill = "glass flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-60";

// Save, or mark applied, without leaving the role page. Once applied, it shows where the role stands in the tracker.
export function SaveRoleButton({ opportunityId, status, signedIn }: { opportunityId: string; status: ApplicationStatus | null; signedIn: boolean }) {
  const [current, setCurrent] = useOptimistic(status);
  const [pending, start] = useTransition();

  function run(next: ApplicationStatus, action: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    if (!signedIn) {
      toast("Sign in first to track roles.");
      return;
    }
    start(async () => {
      setCurrent(next);
      const res = await action();
      if (res.ok) toast.success(done);
      else toast.error(res.error ?? "Could not update your tracker.");
    });
  }

  if (current && current !== "saved") {
    return (
      <Link href="/me/tracker" className={pill}>
        <CircleCheck className="size-4 text-good" /> {statusLabel[current]}
      </Link>
    );
  }

  return (
    <>
      {current === "saved" ? (
        <Link href="/me/tracker" className={pill}>
          <BookmarkCheck className="size-4 text-good" /> In your tracker
        </Link>
      ) : (
        <button type="button" disabled={pending} onClick={() => run("saved", () => saveRoleToTracker(opportunityId), "Saved to your tracker")} className={pill}>
          <Bookmark className="size-4" /> Save to tracker
        </button>
      )}
      <button type="button" disabled={pending} onClick={() => run("applied", () => markRoleApplied(opportunityId), "Marked as applied today")} className={pill}>
        <Send className="size-4" /> I applied
      </button>
    </>
  );
}
