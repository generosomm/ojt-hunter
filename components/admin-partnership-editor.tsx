"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Handshake } from "lucide-react";
import { toast } from "sonner";
import { updatePartnership, type EditState } from "@/app/admin/actions";
import { Field, inputClass } from "@/components/field";
import type { Partnership } from "@/lib/types";

type Moa = { status: string; notes: string | null } | null;

// admin-only: confirm or change a company's school partnership and its MOA request
export function AdminPartnershipEditor({ slug, partnership, moa }: { slug: string; partnership: Partnership | null; moa: Moa }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<EditState, FormData>(updatePartnership.bind(null, slug), { ok: false });
  const e = state.errors ?? {};
  useEffect(() => {
    if (state.message) (state.ok ? toast.success : toast.error)(state.message);
  }, [state]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="glass flex h-10 w-fit items-center gap-2 rounded-full px-4 text-sm">
        <Handshake className="size-4" /> Edit partnership (admin)
      </button>
    );
  }

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      className="glass grid gap-3 rounded-[22px] p-4 sm:grid-cols-2"
    >
      <Field label="Partnership" name="status" error={e.status}>
        <select id="status" name="status" defaultValue={partnership?.status ?? "needs_clarification"} className={inputClass}>
          <option value="listed_in_hte">On the HTE list</option>
          <option value="confirmed_by_school">Confirmed by school</option>
          <option value="confirmed_by_company">Confirmed by company</option>
          <option value="moa_requested">MOA requested</option>
          <option value="needs_clarification">Needs clarification</option>
          <option value="not_listed">Not on the list</option>
        </select>
      </Field>
      <Field label="Name as listed" name="matched_name_as_listed" error={e.matched_name_as_listed}>
        <input id="matched_name_as_listed" name="matched_name_as_listed" defaultValue={partnership?.matched_name_as_listed ?? ""} className={inputClass} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Partnership notes" name="notes" error={e.notes} hint="Shown to everyone. Say where it was confirmed.">
          <textarea id="notes" name="notes" rows={2} defaultValue={partnership?.notes ?? ""} className="glass w-full rounded-2xl px-3.5 py-2.5 text-base outline-none" />
        </Field>
      </div>
      <Field label="MOA request" name="moa_status" error={e.moa_status}>
        <select id="moa_status" name="moa_status" defaultValue={moa?.status ?? "none"} className={inputClass}>
          {!moa && <option value="none">No request</option>}
          <option value="requested">Requested</option>
          <option value="in_progress">In progress</option>
          <option value="approved">Approved</option>
          <option value="rejected">Not approved</option>
          <option value="unknown">Unknown</option>
        </select>
      </Field>
      <Field label="MOA notes" name="moa_notes" error={e.moa_notes}>
        <input id="moa_notes" name="moa_notes" defaultValue={moa?.notes ?? ""} className={inputClass} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full px-4 text-sm text-ink-soft">Close</button>
        <button type="submit" disabled={pending} className="h-10 rounded-full bg-nu-blue px-5 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Saving..." : "Save partnership"}
        </button>
      </div>
    </form>
  );
}
