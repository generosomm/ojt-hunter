"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { saveRoleToTracker } from "@/app/me/actions";

export function SaveRoleButton({ opportunityId, saved, signedIn }: { opportunityId: string; saved: boolean; signedIn: boolean }) {
  const [isSaved, setSaved] = useOptimistic(saved);
  const [pending, start] = useTransition();

  if (isSaved) {
    return (
      <Link href="/me/tracker" className="glass flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium">
        <BookmarkCheck className="size-4 text-good" /> In your tracker
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!signedIn) {
          toast("Sign in first to save roles.");
          return;
        }
        start(async () => {
          setSaved(true);
          const res = await saveRoleToTracker(opportunityId);
          if (res.ok) toast.success("Saved to your tracker");
          else toast.error(res.error);
        });
      }}
      className="glass flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-60"
    >
      <Bookmark className="size-4" /> Save to tracker
    </button>
  );
}
