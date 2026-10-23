"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { PencilLine } from "lucide-react";
import { toast } from "sonner";
import { updateRole, type EditState } from "@/app/admin/actions";
import { Field, inputClass } from "@/components/field";
import type { OpportunityDetail } from "@/lib/types";

const v = (x: unknown) => (x == null ? "" : String(x));

// admin-only quick edit of the facts students filter by
export function AdminRoleEditor({ opp }: { opp: OpportunityDetail }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<EditState, FormData>(updateRole.bind(null, opp.slug), { ok: false });
  const e = state.errors ?? {};
  useEffect(() => {
    if (state.message) (state.ok ? toast.success : toast.error)(state.message);
  }, [state]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="glass flex h-10 w-fit items-center gap-2 rounded-full px-4 text-sm">
        <PencilLine className="size-4" /> Edit role (admin)
      </button>
    );
  }

  const sel = (name: string, value: string, options: [string, string][]) => (
    <select id={name} name={name} defaultValue={value} aria-invalid={Boolean(e[name])} className={inputClass}>
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
  const inp = (name: string, value: unknown, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={name} name={name} defaultValue={v(value)} aria-invalid={Boolean(e[name])} className={inputClass} {...props} />
  );

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      className="glass grid gap-3 rounded-[22px] p-4 sm:grid-cols-2"
    >
      <Field label="Post" name="post_status" error={e.post_status}>
        {sel("post_status", opp.post_status, [["open", "Open"], ["recurring_program", "Recurring"], ["unconfirmed", "Unconfirmed"], ["no_post_cold_email", "No post"], ["closed", "Closed"]])}
      </Field>
      <Field label="Setup" name="setup" error={e.setup}>
        {sel("setup", opp.setup, [["onsite", "Onsite"], ["hybrid", "Hybrid"], ["remote", "Remote"], ["unknown", "Unknown"]])}
      </Field>
      <Field label="City" name="city" error={e.city}>{inp("city", opp.city)}</Field>
      <Field label="Kind of work" name="dev_exposure" error={e.dev_exposure}>
        {sel("dev_exposure", opp.dev_exposure, [["high", "Real dev work"], ["some", "Some dev"], ["low", "Little dev"], ["low_repetitive", "Repetitive"], ["unknown", "Unclear"]])}
      </Field>
      <Field label="Pay" name="allowance_status" error={e.allowance_status}>
        {sel("allowance_status", opp.allowance_status, [["disclosed", "Disclosed"], ["not_disclosed", "Not disclosed"], ["unpaid", "Unpaid"], ["benefits_only", "Benefits only"]])}
      </Field>
      <Field label="Pay basis" name="allowance_basis" error={e.allowance_basis}>
        {sel("allowance_basis", opp.allowance_basis, [["per_day", "Per day"], ["per_month", "Per month"], ["per_hour", "Per hour"], ["unknown", "Period unclear"]])}
      </Field>
      <Field label="Amount" name="allowance_amount" error={e.allowance_amount}>{inp("allowance_amount", opp.allowance_amount, { type: "number", step: "any", min: 0 })}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min" name="allowance_min" error={e.allowance_min}>{inp("allowance_min", opp.allowance_min, { type: "number", step: "any", min: 0 })}</Field>
        <Field label="Max" name="allowance_max" error={e.allowance_max}>{inp("allowance_max", opp.allowance_max, { type: "number", step: "any", min: 0 })}</Field>
      </div>
      <Field label="Pay source" name="allowance_source" error={e.allowance_source}>{inp("allowance_source", opp.allowance_source)}</Field>
      <label className="flex min-h-11 items-center gap-3 self-end text-sm">
        <input type="checkbox" name="allowance_verified" defaultChecked={opp.allowance_verified} className="size-4 accent-[var(--nu-blue)]" /> Pay verified
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hours min" name="required_hours_min" error={e.required_hours_min}>{inp("required_hours_min", opp.required_hours_min, { type: "number", min: 1 })}</Field>
        <Field label="Hours max" name="required_hours_max" error={e.required_hours_max}>{inp("required_hours_max", opp.required_hours_max, { type: "number", min: 1 })}</Field>
      </div>
      <Field label="Nov start" name="accepts_nov_start" error={e.accepts_nov_start}>
        {sel("accepts_nov_start", opp.accepts_nov_start, [["yes", "Yes"], ["no", "No"], ["ask", "Ask"]])}
      </Field>
      <Field label="Posted on" name="posted_on" error={e.posted_on}>{inp("posted_on", opp.posted_on, { type: "date" })}</Field>
      <Field label="Apply link" name="apply_url" error={e.apply_url}>{inp("apply_url", opp.apply_url, { type: "url" })}</Field>
      <Field label="Apply instructions" name="apply_instructions" error={e.apply_instructions}>{inp("apply_instructions", opp.apply_instructions)}</Field>
      <div className="sm:col-span-2">
        <Field label="Notes" name="notes" error={e.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={v(opp.notes)} className="glass w-full rounded-2xl px-3.5 py-2.5 text-base outline-none" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="mark_checked" className="size-4 accent-[var(--nu-blue)]" /> Mark checked today
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full px-4 text-sm text-ink-soft">Close</button>
          <button type="submit" disabled={pending} className="h-10 rounded-full bg-nu-blue px-5 text-sm font-medium text-white disabled:opacity-60">
            {pending ? "Saving..." : "Save role"}
          </button>
        </div>
      </div>
    </form>
  );
}
