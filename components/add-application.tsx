"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addManualApplication } from "@/app/me/actions";
import { Field, inputClass } from "@/components/field";
import { APPLICATION_STATUSES, type FieldErrors } from "@/lib/schemas";
import { statusLabel } from "@/lib/tracker";

// for companies that are not in the directory
export function AddApplication() {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="glass flex h-11 w-fit items-center gap-2 rounded-full px-4 text-sm font-medium">
        <Plus className="size-4" /> Add a company
      </button>
    );
  }

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        start(async () => {
          const res = await addManualApplication({ ok: false }, data);
          setErrors(res.errors ?? {});
          if (res.ok) {
            toast.success(res.message ?? "Added");
            setOpen(false);
          } else if (res.message) toast.error(res.message);
        });
      }}
      className="glass grid gap-3 rounded-[22px] p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
    >
      <Field label="Company" name="company_name_manual" error={errors.company_name_manual}>
        <input id="company_name_manual" name="company_name_manual" required autoFocus className={inputClass} />
      </Field>
      <Field label="Role" name="role_manual" error={errors.role_manual}>
        <input id="role_manual" name="role_manual" className={inputClass} />
      </Field>
      <Field label="Status" name="status" error={errors.status}>
        <select id="status" name="status" defaultValue="saved" className={inputClass}>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
      </Field>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full px-4 text-sm text-ink-soft">Cancel</button>
        <button type="submit" disabled={pending} className="h-11 rounded-full bg-nu-blue px-5 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
