import type { ReactNode } from "react";

export const inputClass =
  "glass h-11 w-full rounded-2xl px-3.5 text-base outline-none placeholder:text-ink-soft/70 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-bad";

// a labeled control with its error under it
export function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={name}>
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      {children}
      {error ? (
        <span id={`${name}-error`} className="text-xs text-bad">
          {error}
        </span>
      ) : (
        hint && <span className="text-xs text-ink-soft">{hint}</span>
      )}
    </label>
  );
}
