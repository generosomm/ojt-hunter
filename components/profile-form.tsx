"use client";

import { startTransition, useActionState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { saveProfile, type FormState } from "@/app/me/actions";
import { Field, inputClass } from "@/components/field";
import type { Profile } from "@/lib/me";

type Props = { profile: Profile | null; defaultHours: number };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="glass flex flex-col gap-4 rounded-[22px] p-5">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function ProfileForm({ profile: p, defaultHours }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, { ok: false });
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.message) (state.ok ? toast.success : toast.error)(state.message);
  }, [state]);

  const input = (name: keyof Profile, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const raw = p?.[name];
    const value = Array.isArray(raw) ? raw.join(", ") : raw == null ? "" : String(raw);
    return (
      <input
        id={name}
        name={name}
        defaultValue={value}
        aria-invalid={Boolean(e[name])}
        aria-describedby={e[name] ? `${name}-error` : undefined}
        className={inputClass}
        {...props}
      />
    );
  };

  return (
    // submit by hand: a plain form action resets the inputs, losing edits when validation fails
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-4"
    >
      <Section title="OJT">
        <Field label="Required hours" name="required_hours" error={e.required_hours} hint={`Blank uses ${defaultHours}`}>
          {input("required_hours", { type: "number", inputMode: "numeric", min: 1, placeholder: String(defaultHours) })}
        </Field>
        <Field label="Can extend to" name="max_hours" error={e.max_hours}>
          {input("max_hours", { type: "number", inputMode: "numeric", min: 1, placeholder: "800" })}
        </Field>
        <Field label="Available from" name="available_from" error={e.available_from}>
          {input("available_from", { type: "date" })}
        </Field>
        <Field label="Expected graduation" name="expected_graduation" error={e.expected_graduation}>
          {input("expected_graduation", { type: "date" })}
        </Field>
      </Section>

      <Section title="Where and pay">
        <Field label="Preferred cities" name="preferred_cities" error={e.preferred_cities} hint="Separate with commas">
          {input("preferred_cities", { placeholder: "Makati, Taguig, Pasig" })}
        </Field>
        <Field label="Minimum pay per day (₱)" name="min_allowance_per_day" error={e.min_allowance_per_day}>
          {input("min_allowance_per_day", { type: "number", inputMode: "numeric", min: 0, step: 50 })}
        </Field>
        <Field label="Based in" name="location_base" error={e.location_base}>
          {input("location_base")}
        </Field>
        <Field label="Willing to relocate" name="willing_to_relocate" error={e.willing_to_relocate}>
          <select
            id="willing_to_relocate"
            name="willing_to_relocate"
            defaultValue={p?.willing_to_relocate == null ? "" : p.willing_to_relocate ? "yes" : "no"}
            className={inputClass}
          >
            <option value="">Not set</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
      </Section>

      <Section title="About you">
        <Field label="Full name" name="full_name" error={e.full_name}>{input("full_name", { autoComplete: "name" })}</Field>
        <Field label="Display name" name="display_name" error={e.display_name} hint="Shown if you share updates">{input("display_name")}</Field>
        <Field label="School" name="school" error={e.school}>{input("school")}</Field>
        <Field label="Campus" name="campus" error={e.campus}>{input("campus")}</Field>
        <Field label="Program" name="program" error={e.program}>{input("program", { placeholder: "BS Information Technology" })}</Field>
        <Field label="Year" name="year_level" error={e.year_level}>{input("year_level", { placeholder: "4th year" })}</Field>
        <Field label="OJT coordinator (FIC)" name="fic_name" error={e.fic_name}>{input("fic_name")}</Field>
      </Section>

      <Section title="Contact and links">
        <Field label="Email" name="email" error={e.email}>{input("email", { type: "email", autoComplete: "email" })}</Field>
        <Field label="Phone" name="phone" error={e.phone}>{input("phone", { type: "tel", autoComplete: "tel" })}</Field>
        <Field label="Portfolio" name="portfolio_url" error={e.portfolio_url}>{input("portfolio_url", { type: "url", placeholder: "https://" })}</Field>
        <Field label="LinkedIn" name="linkedin_url" error={e.linkedin_url}>{input("linkedin_url", { type: "url", placeholder: "https://" })}</Field>
        <Field label="GitHub" name="github_url" error={e.github_url}>{input("github_url", { type: "url", placeholder: "https://" })}</Field>
      </Section>

      <fieldset className="glass flex flex-col gap-4 rounded-[22px] p-5">
        <legend className="sr-only">Skills and projects</legend>
        <h2 className="font-semibold">Skills and projects</h2>
        <Field label="Skills" name="skills" error={e.skills} hint="Only what you actually use. Separate with commas.">
          {input("skills", { placeholder: "React, Node.js, MySQL" })}
        </Field>
        <Field label="Projects" name="projects" error={e.projects} hint="One or two lines each. Used later to fill email templates.">
          <textarea
            id="projects"
            name="projects"
            defaultValue={p?.projects ?? ""}
            rows={5}
            aria-invalid={Boolean(e.projects)}
            className="glass w-full rounded-2xl px-3.5 py-3 text-base outline-none"
          />
        </Field>
      </fieldset>

      <div className="sticky bottom-24 z-10 flex justify-end">
        <button type="submit" disabled={pending} className="h-12 rounded-full bg-nu-blue px-7 font-medium text-white shadow-lg disabled:opacity-60">
          {pending ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
