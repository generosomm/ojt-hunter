// Server-side validation for everything a signed-in user can save.
import { z } from "zod";

const text = (max: number) =>
  z.string().trim().max(max, `Keep it under ${max} characters.`).transform((v) => (v === "" ? null : v));
const url = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^https?:\/\/\S+$/.test(v), "Start the link with https://");
const date = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Pick a date.");
const optionalInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), `Use a whole number from ${min} to ${max}.`);
const list = (max: number) =>
  z
    .string()
    .trim()
    .max(600)
    .transform((v) => [...new Set(v.split(",").map((x) => x.trim()).filter(Boolean))].slice(0, max));

const profileShape = {
    display_name: text(60),
    full_name: text(120),
    school: text(120),
    campus: text(60),
    program: text(80),
    year_level: text(30),
    required_hours: optionalInt(1, 3000),
    max_hours: optionalInt(1, 3000),
    available_from: date,
    expected_graduation: date,
    preferred_cities: list(10),
    min_allowance_per_day: optionalInt(0, 100000),
    location_base: text(120),
    willing_to_relocate: z.enum(["", "yes", "no"]).transform((v) => (v === "" ? null : v === "yes")),
    email: z
      .string()
      .trim()
      .max(200)
      .transform((v) => (v === "" ? null : v))
      .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Check the email."),
    phone: text(30),
    skills: list(30),
    projects: text(3000),
    portfolio_url: url,
    linkedin_url: url,
    github_url: url,
    fic_name: text(120),
};

export const PROFILE_FIELDS = Object.keys(profileShape);

export const profileSchema = z
  .object(profileShape)
  .refine((p) => p.required_hours == null || p.max_hours == null || p.max_hours >= p.required_hours, {
    path: ["max_hours"],
    message: "Max hours can't be lower than required hours.",
  });

export const APPLICATION_STATUSES = ["saved", "applied", "assessment", "interview", "offered", "accepted", "declined", "rejected", "withdrawn", "closed"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const manualApplicationSchema = z.object({
  company_name_manual: z.string().trim().min(1, "Add the company.").max(120),
  role_manual: text(160),
  status: z.enum(APPLICATION_STATUSES),
});

export const applicationEditSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  applied_on: date,
  channel: text(60),
  follow_up_on: date,
  interview_at: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Pick a date and time."),
  interview_link: url,
  confirmed_allowance: text(120),
  confirmed_schedule: text(120),
  notes: text(3000),
  decline_reason: text(300),
});

export const CHECKLIST_STATUSES = ["todo", "in_progress", "done", "na"] as const;

export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export const OPEN_CHECK_RESULTS = ["opened_and_open", "opened_but_closed", "link_dead"] as const;

export const UPDATE_TYPES = ["post_closed", "allowance_confirmed", "hours_confirmed", "moa_clarification", "email_bounced", "correction"] as const;

const evidenceUrl = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^https:\/\/\S+$/.test(v), "Use a full https:// link.");
const evidenceNote = z.string().trim().max(1000, "Keep it under 1000 characters.").transform((v) => (v === "" ? null : v));

// a new role: the admin reviews it and it lands as a draft
export const newRoleSchema = z
  .object({
    company: z.string().trim().min(2, "Add the company.").max(120),
    title: z.string().trim().min(2, "Add the role.").max(160),
    apply_url: evidenceUrl,
    city: text(80),
    setup: z.enum(["onsite", "hybrid", "remote", "unknown"]),
    allowance: text(200),
    notes: text(1000),
    evidence_url: evidenceUrl,
    evidence_note: evidenceNote,
  })
  .refine((v) => v.apply_url || v.evidence_url, { path: ["evidence_url"], message: "Add the post link so it can be checked." });

// an update on an existing role: what changed + where you saw it
export const roleUpdateSchema = z
  .object({
    role: z.string().regex(/^[a-z0-9-]+$/, "Pick a role."),
    type: z.enum(UPDATE_TYPES),
    value: z.string().trim().min(2, "Say what changed.").max(500),
    email: z
      .string()
      .trim()
      .max(200)
      .transform((v) => (v === "" ? null : v))
      .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Check the email."),
    evidence_url: evidenceUrl,
    evidence_note: evidenceNote,
  })
  .refine((v) => v.type !== "email_bounced" || v.email, { path: ["email"], message: "Add the address that bounced." })
  .refine((v) => v.evidence_url || v.evidence_note, { path: ["evidence_note"], message: "Add a link or a short note on how you know." });

const optionalMoney = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v <= 1_000_000), "Use a number.");

// admin edit of a role's key facts; the database also checks that amounts only exist when pay is disclosed
export const roleEditSchema = z
  .object({
    post_status: z.enum(["open", "closed", "unconfirmed", "recurring_program", "no_post_cold_email"]),
    setup: z.enum(["onsite", "hybrid", "remote", "unknown"]),
    city: text(120),
    allowance_status: z.enum(["disclosed", "not_disclosed", "unpaid", "benefits_only"]),
    allowance_basis: z.enum(["per_day", "per_month", "per_hour", "unknown"]),
    allowance_amount: optionalMoney,
    allowance_min: optionalMoney,
    allowance_max: optionalMoney,
    allowance_source: text(500),
    allowance_verified: z.enum(["", "on"]).transform((v) => v === "on"),
    required_hours_min: optionalInt(1, 3000),
    required_hours_max: optionalInt(1, 3000),
    accepts_nov_start: z.enum(["yes", "no", "ask"]),
    dev_exposure: z.enum(["high", "some", "low", "low_repetitive", "unknown"]),
    apply_url: url,
    apply_instructions: text(500),
    notes: text(1000),
    mark_checked: z.enum(["", "on"]).transform((v) => v === "on"),
  })
  .refine((r) => r.allowance_status === "disclosed" || (r.allowance_amount == null && r.allowance_min == null && r.allowance_max == null), {
    path: ["allowance_status"],
    message: "Amounts only go with a disclosed allowance.",
  })
  .refine((r) => r.allowance_status !== "disclosed" || r.allowance_amount != null || r.allowance_min != null, {
    path: ["allowance_amount"],
    message: "Add the amount or a min.",
  })
  .refine((r) => r.allowance_min == null || r.allowance_max == null || r.allowance_min <= r.allowance_max, {
    path: ["allowance_max"],
    message: "Max can't be below min.",
  })
  .refine((r) => r.required_hours_min == null || r.required_hours_max == null || r.required_hours_min <= r.required_hours_max, {
    path: ["required_hours_max"],
    message: "Max hours can't be below min.",
  });

export const partnershipEditSchema = z.object({
  status: z.enum(["listed_in_hte", "confirmed_by_school", "confirmed_by_company", "not_listed", "moa_requested", "needs_clarification"]),
  matched_name_as_listed: text(200),
  notes: text(1000),
  moa_status: z.enum(["none", "requested", "in_progress", "approved", "rejected", "unknown"]),
  moa_notes: text(1000),
});
