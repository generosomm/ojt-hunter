"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitNewRole, submitRoleUpdate, type SubmitState } from "@/app/submit/actions";
import { Field, inputClass } from "@/components/field";
import type { FieldErrors } from "@/lib/schemas";

type Role = { slug: string; label: string };

const updateTypes = [
  { value: "post_closed", label: "The post is closed" },
  { value: "allowance_confirmed", label: "Pay is confirmed" },
  { value: "hours_confirmed", label: "Hours or start date confirmed" },
  { value: "moa_clarification", label: "MOA or school partner info" },
  { value: "email_bounced", label: "An email bounced" },
  { value: "correction", label: "Something else is wrong" },
];

const textareaClass = "glass w-full rounded-2xl px-3.5 py-2.5 text-base outline-none";

export function SubmitForm({ roles, initialRole }: { roles: Role[]; initialRole: string | null }) {
  const [mode, setMode] = useState<"update" | "new">("update");
  const [type, setType] = useState("post_closed");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const send = (action: (prev: SubmitState, form: FormData) => Promise<SubmitState>) => (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    start(async () => {
      const res = await action({ ok: false }, data);
      setErrors(res.errors ?? {});
      if (res.ok) setSent(true);
      if (res.message) (res.ok ? toast.success : toast.error)(res.message);
    });
  };

  if (sent) {
    return (
      <div className="glass-strong rounded-[28px] p-8 text-center">
        <p className="text-lg font-semibold">Sent for review</p>
        <p className="mt-1 text-sm text-ink-soft">An admin checks it before anything changes.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-5 h-11 rounded-full bg-nu-blue px-5 text-sm font-medium text-white">
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="What are you sending?" className="glass flex w-full gap-1 rounded-full p-1 sm:w-fit">
        {(["update", "new"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setErrors({}); }}
            className={`h-10 flex-1 rounded-full px-4 text-sm font-medium sm:flex-none ${mode === m ? "bg-nu-blue text-white" : "text-ink-soft"}`}
          >
            {m === "update" ? "Update a role" : "New role"}
          </button>
        ))}
      </div>

      {mode === "update" ? (
        <form onSubmit={send(submitRoleUpdate)} className="glass flex flex-col gap-4 rounded-[22px] p-5">
          <Field label="Role" name="role" error={errors.role}>
            <select id="role" name="role" defaultValue={initialRole ?? ""} className={`${inputClass} min-w-0`}>
              <option value="" disabled>Pick a role</option>
              {roles.map((r) => (
                <option key={r.slug} value={r.slug}>{r.label}</option>
              ))}
            </select>
          </Field>
          <Field label="What changed" name="type" error={errors.type}>
            <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              {updateTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          {type === "email_bounced" && (
            <Field label="Address that bounced" name="email" error={errors.email}>
              <input id="email" name="email" type="email" className={inputClass} />
            </Field>
          )}
          <Field label="Details" name="value" error={errors.value} hint="Exact values help, e.g. PHP 400/day or 600 hours OK.">
            <textarea id="value" name="value" rows={3} className={textareaClass} />
          </Field>
          <Evidence errors={errors} />
          <SubmitButton pending={pending} />
        </form>
      ) : (
        <form onSubmit={send(submitNewRole)} className="glass flex flex-col gap-4 rounded-[22px] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" name="company" error={errors.company}><input id="company" name="company" className={inputClass} /></Field>
            <Field label="Role" name="title" error={errors.title}><input id="title" name="title" className={inputClass} /></Field>
            <Field label="Apply link" name="apply_url" error={errors.apply_url}><input id="apply_url" name="apply_url" type="url" placeholder="https://" className={inputClass} /></Field>
            <Field label="City" name="city" error={errors.city}><input id="city" name="city" className={inputClass} /></Field>
            <Field label="Setup" name="setup" error={errors.setup}>
              <select id="setup" name="setup" defaultValue="unknown" className={inputClass}>
                <option value="unknown">Not sure</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </Field>
            <Field label="Pay, as written" name="allowance" error={errors.allowance} hint='e.g. "PHP 300/day" or "not stated"'>
              <input id="allowance" name="allowance" className={inputClass} />
            </Field>
          </div>
          <Field label="Anything else" name="notes" error={errors.notes}>
            <textarea id="notes" name="notes" rows={3} className={textareaClass} />
          </Field>
          <Evidence errors={errors} />
          <SubmitButton pending={pending} />
        </form>
      )}
    </div>
  );
}

function Evidence({ errors }: { errors: FieldErrors }) {
  return (
    <>
      <Field label="Link that shows it" name="evidence_url" error={errors.evidence_url}>
        <input id="evidence_url" name="evidence_url" type="url" placeholder="https://" className={inputClass} />
      </Field>
      <Field label="Or how you know" name="evidence_note" error={errors.evidence_note} hint="Summarize HR replies. No names or personal numbers.">
        <textarea id="evidence_note" name="evidence_note" rows={2} className={textareaClass} />
      </Field>
    </>
  );
}

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className="h-12 rounded-full bg-nu-blue px-6 font-medium text-white disabled:opacity-60 sm:self-end">
      {pending ? "Sending..." : "Send for review"}
    </button>
  );
}
