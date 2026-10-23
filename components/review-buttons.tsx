"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { reviewSubmission } from "@/app/admin/actions";

export function ReviewButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const run = (approve: boolean) =>
    start(async () => {
      const res = await reviewSubmission(id, approve);
      if (res.ok) toast.success(res.message ?? "Done");
      else toast.error(res.error);
    });
  return (
    <div className="flex gap-2">
      <button type="button" disabled={pending} onClick={() => run(false)} className="glass flex h-10 items-center gap-1.5 rounded-full px-4 text-sm disabled:opacity-60">
        <X className="size-4" /> Reject
      </button>
      <button type="button" disabled={pending} onClick={() => run(true)} className="flex h-10 items-center gap-1.5 rounded-full bg-nu-blue px-4 text-sm font-medium text-white disabled:opacity-60">
        <Check className="size-4" /> Approve
      </button>
    </div>
  );
}
