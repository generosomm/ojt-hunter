import type { AllowanceStatus, Listing } from "./types";

const peso = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });

export function allowanceHeadline(l: Pick<Listing, "allowance_status" | "allowance_per_day_low" | "allowance_per_day_high" | "allowance_amount">) {
  const status: AllowanceStatus = l.allowance_status;
  if (status === "unpaid") return { main: "Unpaid", unit: "" };
  if (status === "benefits_only") return { main: "Benefits", unit: "only" };
  if (status !== "disclosed") return { main: "Not disclosed", unit: "" };
  const lo = l.allowance_per_day_low;
  const hi = l.allowance_per_day_high;
  // disclosed but the pay period is unclear, so no per-day estimate
  if (lo == null && hi == null) return { main: `₱${peso.format(l.allowance_amount ?? 0)}`, unit: "period unclear" };
  const range = lo != null && hi != null && lo !== hi ? `₱${peso.format(lo)}–${peso.format(hi)}` : `₱${peso.format((lo ?? hi)!)}`;
  return { main: range, unit: "/day est." };
}

export function hoursText(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} hrs`;
  if (min != null && max == null) return `${min}+ hrs`;
  return `${(min ?? max)} hrs`;
}

// "fits my hours": unknown hours are not a mismatch, so they come back as null
export function fitsHours(min: number | null, max: number | null, required: number, canExtendTo: number) {
  if (min == null && max == null) return null;
  if (min != null && min > canExtendTo) return false;
  if (max != null && max < required) return false;
  return true;
}

export function checkedAgo(iso: string | null, timeZone: string, now = new Date()) {
  if (!iso) return "Never checked";
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Checked today";
  if (days === 1) return "Checked yesterday";
  if (days < 30) return `Checked ${days} days ago`;
  return `Checked ${new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone })}`;
}

export function dateText(d: string | null, timeZone: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone });
}

// job board search link: {q} in the stored template becomes the encoded search words
export function boardSearchUrl(template: string, q: string) {
  return template.replaceAll("{q}", encodeURIComponent(q.trim()));
}

// boards match short names better: "Sun Life Global Solutions Philippines, Inc." searches as "Sun Life Global Solutions intern"
const SUFFIX = /\b(philippines|phils?|inc|incorporated|corp|corporation|co|ltd|limited|llc|opc)\b\.?/gi;

export function boardSearchWords(company: string) {
  const name = company.replace(SUFFIX, "").replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
  return `${name || company} intern`;
}

// the calendar date N days before today in the app's time zone, as YYYY-MM-DD (en-CA formats that way)
export function daysAgo(days: number, timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now.getTime() - days * 86_400_000));
}

export function postedAgo(date: string | null, timeZone: string, now = new Date()) {
  if (!date) return null;
  const today = daysAgo(0, timeZone, now);
  const days = Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days}d ago`;
}
