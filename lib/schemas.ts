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
