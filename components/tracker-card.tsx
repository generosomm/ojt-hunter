"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { BellRing, ChevronDown, MailPlus, Trash2 } from "lucide-react";
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
    // one slim row: who, what, when to follow up, status, actions. Details open underneath.
    <li className={`px-3 py-2 sm:px-4 sm:py-2.5 ${due ? "bg-nu-gold/12" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="min-w-0 flex-1 basis-56">
          {app.opportunity ? (
            <Link href={`/opportunities/${app.opportunity.slug}`} className="block truncate font-medium underline-offset-4 hover:underline">
              {role ?? company}
            </Link>
          ) : (
            <p className="truncate font-medium">{role ?? company}</p>
          )}
          <p className="flex min-w-0 items-center gap-2 text-xs text-ink-soft">
            <span className="truncate">{company}</span>
            {app.follow_up_on && (
              <span className={`flex shrink-0 items-center gap-1 ${due ? "font-medium text-warn" : ""}`}>
                <BellRing className="size-3" />
                {due ? (app.follow_up_on === today ? "today" : `due ${shortDate(app.follow_up_on)}`) : shortDate(app.follow_up_on)}
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <label className="sr-only" htmlFor={`status-${app.id}`}>Status</label>
          <select
            id={`status-${app.id}`}
            value={status}
            onChange={(ev) => changeStatus(ev.target.value as ApplicationStatus)}
            className="glass h-9 w-32 rounded-full px-3 text-sm"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
          {app.opportunity && status === "applied" ? (
            <Link
              href={`/templates?t=follow_up&role=${app.opportunity.slug}`}
              aria-label={`Draft a follow-up to ${company}`}
              title="Draft a follow-up"
              className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-ink/8 hover:text-ink"
            >
              <MailPlus className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className="size-9" />
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`Details for ${company}`}
            className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-ink/8 hover:text-ink"
          >
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            const data = new FormData(ev.currentTarget);
            data.set("status", status);
            startTransition(() => action(data));
          }}
          className="mt-3 grid gap-3 border-t border-ink/10 pt-3 sm:grid-cols-2"
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
          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <button type="button" onClick={remove} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-bad">
              <Trash2 className="size-4" /> Remove
            </button>
            <button type="submit" disabled={saving} className="h-10 rounded-full bg-nu-blue px-5 text-sm font-medium text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

// stored as UTC; the form edits Manila time (UTC+8, no daylight saving)
function toManilaLocal(iso: string) {
  const d = new Date(new Date(iso).getTime() + 8 * 3600_000);
  return d.toISOString().slice(0, 16);
}

function shortDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
