"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Ban, CircleAlert } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { fill } from "@/lib/fill";
import type { StudioData } from "@/lib/templates";

type Props = StudioData & { templateKey: string };

export function TemplateStudio({ templates, roles, values, signedIn, hasProfile, role, templateKey }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const template = templates.find((t) => t.key === templateKey) ?? templates[0];

  const go = (t: string, r: string | null) => {
    const s = new URLSearchParams({ t });
    if (r) s.set("role", r);
    router.replace(`${pathname}?${s}`, { scroll: false });
  };

  if (!template) return <p className="glass rounded-[22px] p-6 text-center text-sm text-ink-soft">No templates yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex min-w-0 flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">Role</span>
          <select value={role?.slug ?? ""} onChange={(e) => go(template.key, e.target.value || null)} className="glass h-11 w-full min-w-0 rounded-2xl px-3 text-base">
            <option value="">No role picked</option>
            {roles.map((r) => (
              <option key={r.slug} value={r.slug}>{r.label}</option>
            ))}
          </select>
        </label>
        <nav aria-label="Templates" className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {templates.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={t.key === template.key}
              onClick={() => go(t.key, role?.slug ?? null)}
              className={`h-10 shrink-0 rounded-full px-4 text-left text-sm lg:rounded-2xl ${t.key === template.key ? "bg-nu-blue text-white" : "glass"}`}
            >
              {t.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* keyed so edits reset when the template or role changes */}
      <Draft key={`${template.key}:${role?.slug ?? ""}`} template={template} values={values} role={role} signedIn={signedIn} hasProfile={hasProfile} />
    </div>
  );
}

function Draft({ template, values, role, signedIn, hasProfile }: Pick<Props, "values" | "role" | "signedIn" | "hasProfile"> & { template: Props["templates"][number] }) {
  const initial = useMemo(() => fill(template, values), [template, values]);
  const useEmployerSubject = template.key === "application" && role?.subjectFormat;
  const [subject, setSubject] = useState(useEmployerSubject ? role!.subjectFormat! : initial.subject ?? "");
  const [body, setBody] = useState(initial.body);
  const markersLeft = /\[[a-z ]+\]/i.test(`${subject}\n${body}`);

  const checks = [
    "Company and role names are right",
    template.needs_resume && "Resume is attached",
    useEmployerSubject && "Subject follows their format",
    role?.applyChannel === "jobstreet" && "JobStreet quick apply: replace any old company's cover letter",
    "No [brackets] left",
  ].filter(Boolean) as string[];

  return (
    <section className="flex flex-col gap-3">
      <p className="px-1 text-sm text-ink-soft">{template.use_when}</p>

      {!signedIn ? (
        <p className="glass rounded-2xl px-4 py-3 text-sm">Sign in and fill your profile to auto-fill your details.</p>
      ) : (
        !hasProfile && (
          <p className="glass rounded-2xl px-4 py-3 text-sm">
            <Link href="/me/profile" className="font-medium underline underline-offset-4">Fill your profile</Link> to auto-fill your details.
          </p>
        )
      )}

      {template.subject !== null && (
        <div className="glass-strong flex items-start gap-2 rounded-[22px] p-3 pl-4">
          <label className="flex-1">
            <span className="text-xs text-ink-soft">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-transparent text-base font-medium outline-none" />
          </label>
          <CopyButton value={subject} label="Copy subject" />
        </div>
      )}

      <div className="glass-strong flex flex-col gap-2 rounded-[22px] p-3 pl-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-soft">{template.subject === null ? "Text" : "Body"}</span>
          <CopyButton value={body} label="Copy body" />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          aria-label="Email body"
          className="min-h-80 w-full resize-y bg-transparent text-base leading-relaxed outline-none"
        />
      </div>

      {markersLeft && (
        <p className="flex items-start gap-2 rounded-2xl bg-warn/12 px-4 py-3 text-sm text-warn">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> Replace the [brackets] before sending. They mark details the app doesn&rsquo;t know.
        </p>
      )}

      {role && (role.usable.length > 0 || role.avoid.length > 0) && (
        <div className="glass rounded-[22px] p-4 text-sm">
          {role.usable.map((c) => (
            <div key={c.email} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate">Send to <span className="font-medium">{c.email}</span>{c.purpose === "questions_only" ? " (questions only)" : ""}</span>
              <CopyButton value={c.email} label={`Copy ${c.email}`} />
            </div>
          ))}
          {role.avoid.map((c) => (
            <p key={c.email} className="mt-2 flex items-center gap-2 text-bad">
              <Ban className="size-4 shrink-0" /> <span className="break-all line-through">{c.email}</span> {c.status === "bounced" ? "bounced" : "is not for resumes"}
            </p>
          ))}
        </div>
      )}

      <fieldset className="glass rounded-[22px] p-4">
        <legend className="sr-only">Before you send</legend>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Before you send</p>
          <Link href="/form-tips" className="text-xs text-ink-soft underline underline-offset-4">Form tips</Link>
        </div>
        <ul className="flex flex-col">
          {checks.map((c) => (
            <li key={c}>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" className="size-4 accent-[var(--nu-blue)]" /> {c}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </section>
  );
}
