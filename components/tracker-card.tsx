"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { BellRing, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteApplication, setApplicationStatus, updateApplication, type FormState } from "@/app/me/actions";
import { Field, inputClass } from "@/components/field";
import type { Application } from "@/lib/me";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/schemas";
import { statusLabel } from "@/lib/tracker";

type Props = { app: Application; today: string };

export function TrackerCard({ app, today }: Props) {
  const [status, setStatus] = useOptimistic<ApplicationStatus>(app.status);
  const [, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [state, action, saving] = useActionState<FormState, FormData>(updateApplication.bind(null, app.id), { ok: false });
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.message) (state.ok ? toast.success : toast.error)(state.message);
  }, [state]);

  const company = app.opportunity?.company_name ?? app.company_name_manual ?? "Company";
  const role = app.opportunity?.title ?? app.role_manual;
  const due = app.follow_up_on && app.follow_up_on <= today;

  const changeStatus = (next: ApplicationStatus) =>
    start(async () => {
      setStatus(next);
      const res = await setApplicationStatus(app.id, next);
      if (!res.ok) toast.error(res.error);
    });

  const remove = () => {
    if (!confirm(`Remove ${company} from your tracker?`)) return;
    start(async () => {
      const res = await deleteApplication(app.id);
      if (res.ok) toast.success("Removed");
      else toast.error(res.error);
    });
  };

  return (
    <article className={`glass flex flex-col gap-3 rounded-[20px] p-4 ${due ? "ring-2 ring-nu-gold" : ""}`}>
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-soft">{company}</p>
        {app.opportunity ? (
          <Link href={`/opportunities/${app.opportunity.slug}`} className="line-clamp-2 font-semibold leading-snug underline-offset-4 hover:underline">
            {role}
          </Link>
        ) : (
          role && <p className="line-clamp-2 font-semibold leading-snug">{role}</p>
        )}
      </div>

      {app.opportunity && status === "applied" && (
        <Link href={`/templates?t=follow_up&role=${app.opportunity.slug}`} className="text-xs font-medium text-nu-blue underline underline-offset-4 dark:text-nu-gold">
          Draft a follow-up
        </Link>
      )}

      {app.follow_up_on && (
        <p className={`flex items-center gap-1.5 text-xs ${due ? "font-medium text-warn" : "text-ink-soft"}`}>
          <BellRing className="size-3.5" />
          {due ? (app.follow_up_on === today ? "Follow up today" : `Follow up was due ${app.follow_up_on}`) : `Follow up ${app.follow_up_on}`}
        </p>
      )}

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`status-${app.id}`}>Status</label>
        <select
          id={`status-${app.id}`}
          value={status}
          onChange={(ev) => changeStatus(ev.target.value as ApplicationStatus)}
          className="glass h-10 flex-1 rounded-full px-3 text-sm font-medium"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Details"
          className="glass grid size-10 shrink-0 place-items-center rounded-full"
        >
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            const data = new FormData(ev.currentTarget);
            data.set("status", status);
            startTransition(() => action(data));
          }}
          className="flex flex-col gap-3 border-t border-ink/10 pt-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Applied on" name={`applied_on-${app.id}`} error={e.applied_on}>
              <input id={`applied_on-${app.id}`} name="applied_on" type="date" defaultValue={app.applied_on ?? ""} className={inputClass} />
            </Field>
            <Field label="Follow up on" name={`follow_up_on-${app.id}`} error={e.follow_up_on}>
              <input id={`follow_up_on-${app.id}`} name="follow_up_on" type="date" defaultValue={app.follow_up_on ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label="Applied via" name={`channel-${app.id}`} error={e.channel}>
            <input id={`channel-${app.id}`} name="channel" defaultValue={app.channel ?? ""} placeholder="JobStreet, email..." className={inputClass} />
          </Field>
          <Field label="Interview" name={`interview_at-${app.id}`} error={e.interview_at}>
            <input
              id={`interview_at-${app.id}`}
              name="interview_at"
              type="datetime-local"
              defaultValue={app.interview_at ? toManilaLocal(app.interview_at) : ""}
              className={inputClass}
            />
          </Field>
          <Field label="Interview link" name={`interview_link-${app.id}`} error={e.interview_link}>
            <input id={`interview_link-${app.id}`} name="interview_link" type="url" defaultValue={app.interview_link ?? ""} placeholder="https://" className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Confirmed pay" name={`confirmed_allowance-${app.id}`} error={e.confirmed_allowance}>
              <input id={`confirmed_allowance-${app.id}`} name="confirmed_allowance" defaultValue={app.confirmed_allowance ?? ""} className={inputClass} />
            </Field>
            <Field label="Confirmed schedule" name={`confirmed_schedule-${app.id}`} error={e.confirmed_schedule}>
              <input id={`confirmed_schedule-${app.id}`} name="confirmed_schedule" defaultValue={app.confirmed_schedule ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label="Notes" name={`notes-${app.id}`} error={e.notes}>
            <textarea id={`notes-${app.id}`} name="notes" rows={3} defaultValue={app.notes ?? ""} className="glass w-full rounded-2xl px-3.5 py-2.5 text-base outline-none" />
          </Field>
          <Field label="Why declined" name={`decline_reason-${app.id}`} error={e.decline_reason}>
            <input id={`decline_reason-${app.id}`} name="decline_reason" defaultValue={app.decline_reason ?? ""} className={inputClass} />
          </Field>
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={remove} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-bad">
              <Trash2 className="size-4" /> Remove
            </button>
            <button type="submit" disabled={saving} className="h-10 rounded-full bg-nu-blue px-5 text-sm font-medium text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

// stored as UTC; the form edits Manila time (UTC+8, no daylight saving)
function toManilaLocal(iso: string) {
  const d = new Date(new Date(iso).getTime() + 8 * 3600_000);
  return d.toISOString().slice(0, 16);
}
