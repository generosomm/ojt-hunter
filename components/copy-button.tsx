"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({ value, label }: { value: string; label: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied!");
    } catch {
      toast.error("Copy failed. Long-press the text to copy it.");
    }
  }
  return (
    <button type="button" onClick={copy} aria-label={label} className="glass grid size-10 shrink-0 place-items-center rounded-full">
      <Copy className="size-4" />
    </button>
  );
}
