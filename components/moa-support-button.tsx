"use client";

import { useOptimistic, useTransition } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { setMoaSupport } from "@/app/actions";

type Props = { requestId: string; mine: boolean; count: number; signedIn: boolean };

export function MoaSupportButton({ requestId, mine, count, signedIn }: Props) {
  const [pending, start] = useTransition();
  const [state, setOptimistic] = useOptimistic({ mine, count });

  const toggle = () => {
    if (!signedIn) {
      toast("Sign in first to add yourself.");
      return;
    }
    start(async () => {
      const next = !state.mine;
      setOptimistic({ mine: next, count: state.count + (next ? 1 : -1) });
      const res = await setMoaSupport(requestId, next);
      if (!res.ok) toast.error(res.error);
      else toast.success(next ? "Added. Your FIC sees the need." : "Removed");
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={state.mine}
      className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-70 ${
        state.mine ? "bg-nu-blue text-white" : "glass"
      }`}
    >
      <Users className="size-4" />
      <span className="tabular">{state.count}</span>
      {state.mine ? "You need this" : "I need this too"}
    </button>
  );
}
