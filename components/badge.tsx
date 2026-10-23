import type { ReactNode } from "react";
import type { Tone } from "@/lib/labels";

const toneClass: Record<Tone, string> = {
  good: "text-good bg-good/10",
  warn: "text-warn bg-warn/12",
  muted: "text-muted bg-muted/10",
  bad: "text-bad bg-bad/10",
};

// text always says the status; color only reinforces it
export function Badge({ tone, children, title }: { tone: Tone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
