// Server-side reads. Every query runs as the visitor, so Row Level Security decides what they see:
// the public gets published rows only, admins also get drafts.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Filters } from "./filters";
import { fitsHours } from "./format";
import { PARTNER_STATUSES, type AppConfig, type Company, type Contact, type Fact, type Listing, type OpportunityDetail, type Partnership } from "./types";

const LISTING_COLUMNS =
  "id, slug, title, company_name, company_slug, role_category, city, setup, onsite_days_per_week, employment_type, dev_exposure, allowance_status, allowance_basis, allowance_amount, allowance_per_day_low, allowance_per_day_high, required_hours_min, required_hours_max, accepts_nov_start, post_status, last_checked_at, needs_recheck, partnership_status, is_published, created_at";

export type Viewer = {
  userId: string | null;
  isAdmin: boolean;
  requiredHours: number;
  maxHours: number;
  hasProfileHours: boolean;
  cities: string[];
  minPay: number | null;
};

async function loadConfig(): Promise<AppConfig> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_config")
    .select("campus, hte_list_version, working_days_per_month, hours_per_day, default_required_hours, stale_after_days, timezone")
    .single();
  if (error || !data) throw new Error(`Could not load app settings: ${error?.message ?? "no row"}`);
  return data as AppConfig;
}

async function loadViewer(config: AppConfig): Promise<Viewer> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;
  const fallback = { userId, isAdmin: false, requiredHours: config.default_required_hours, maxHours: config.default_required_hours, hasProfileHours: false, cities: [], minPay: null };
  if (!userId) return fallback;

  const [admin, profile] = await Promise.all([
    supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("required_hours, max_hours, preferred_cities, min_allowance_per_day").eq("user_id", userId).maybeSingle(),
  ]);
  const required = profile.data?.required_hours ?? config.default_required_hours;
  return {
    userId,
    isAdmin: Boolean(admin.data),
    requiredHours: required,
    maxHours: Math.max(profile.data?.max_hours ?? required, required),
    hasProfileHours: profile.data?.required_hours != null,
    cities: (profile.data?.preferred_cities ?? []) as string[],
    minPay: profile.data?.min_allowance_per_day ?? null,
  };
}

export async function getListings(f: Filters, viewer: Viewer) {
  const supabase = await createClient();
  let query = supabase.from("opportunity_listing").select(LISTING_COLUMNS).limit(200);

  if (f.q) query = query.or(`title.ilike.%${f.q}%,company_name.ilike.%${f.q}%`);
  if (f.city) query = query.ilike("city", `%${f.city}%`);
  if (f.roles.length) query = query.in("role_category", f.roles);
  const setups = f.setups.filter((s) => f.remote || s !== "remote");
  if (setups.length) query = query.in("setup", setups);
  else if (!f.remote) query = query.neq("setup", "remote");
  if (f.min) {
    query = f.nd
      ? query.or(`allowance_per_day_high.gte.${f.min},allowance_status.eq.not_disclosed`)
      : query.gte("allowance_per_day_high", f.min);
  }
  if (f.me && viewer.userId) {
    // only letters and spaces reach the filter string
    const cities = viewer.cities.map((c) => c.replace(/[^\p{L} .-]/gu, "").trim()).filter(Boolean);
    if (cities.length) query = query.or(cities.map((c) => `city.ilike.%${c}%`).join(","));
    // unknown pay is not unpaid, so "not disclosed" stays in
    if (viewer.minPay) query = query.or(`allowance_per_day_high.gte.${viewer.minPay},allowance_status.eq.not_disclosed`);
  }
  if (f.hte) query = query.in("partnership_status", [...PARTNER_STATUSES]);
  if (f.nov) query = query.neq("accepts_nov_start", "no");
  if (f.dev.length) query = query.in("dev_exposure", f.dev);
  if (!f.closed) query = query.neq("post_status", "closed");

  // unknown pay never sorts as zero: it goes last
  if (f.sort === "pay") query = query.order("allowance_per_day_high", { ascending: false, nullsFirst: false }).order("last_checked_at", { ascending: false });
  if (f.sort === "checked") query = query.order("last_checked_at", { ascending: false, nullsFirst: false });
  if (f.sort === "new") query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`Could not load listings: ${error.message}`);
  let rows = (data ?? []) as Listing[];
  if (f.fits || (f.me && viewer.userId)) rows = rows.filter((r) => fitsHours(r.required_hours_min, r.required_hours_max, viewer.requiredHours, viewer.maxHours) !== false);
  return rows;
}

async function loadDirectoryStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunity_listing").select("city, partnership_status, post_status, setup");
  if (error) throw new Error(`Could not load stats: ${error.message}`);
  const rows = data ?? [];
  const live = rows.filter((r) => r.post_status !== "closed" && r.setup !== "remote");
  return {
    live: live.length,
    partners: live.filter((r) => (PARTNER_STATUSES as readonly string[]).includes(r.partnership_status ?? "")).length,
    cities: rows.map((r) => r.city as string | null),
  };
}

export async function getOpportunity(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunity_listing").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load this role: ${error.message}`);
  if (!data) return null;
  const opp = data as OpportunityDetail;
  const [facts, checks] = await Promise.all([
    supabase.from("fact_sources").select("id, field, value, source_url, source_type, state, observed_on").eq("entity", "opportunity").eq("entity_id", opp.id).order("observed_on", { ascending: false }),
    supabase.rpc("open_check_history", { opp: opp.id }),
  ]);
  return { opp, facts: (facts.data ?? []) as Fact[], checks: (checks.data ?? []) as { result: string; checked_at: string }[] };
}

export async function getCompany(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, slug, name, legal_name, website, careers_url, industry, hq_location, description, founded_year, size_text, background_source, is_published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load this company: ${error.message}`);
  if (!data) return null;
  const company = data as Company;
  const config = await getConfig();
  const [partnership, contacts, roles, moa] = await Promise.all([
    supabase.from("partnerships").select("id, status, matched_name_as_listed, source, notes, hte_entry:hte_list_entries(list_version)").eq("company_id", company.id).eq("campus", config.campus).maybeSingle(),
    supabase.from("company_contacts").select("id, email, purpose, status, bounce_code, notes, observed_on").eq("company_id", company.id),
    supabase.from("opportunity_listing").select(LISTING_COLUMNS).eq("company_id", company.id).order("post_status"),
    supabase.from("moa_requests").select("id, status, requested_on, notes").eq("company_id", company.id).eq("campus", config.campus).maybeSingle(),
  ]);
  return {
    company,
    config,
    partnership: (partnership.data ?? null) as Partnership | null,
    contacts: (contacts.data ?? []) as Contact[],
    roles: (roles.data ?? []) as Listing[],
    moa: moa.data as { id: string; status: string; requested_on: string | null; notes: string | null } | null,
  };
}

// ---------- P3: checker, MOA board, cold emails ----------

export type HteMatch = { entry_no: number; name_as_listed: string; score: number };
export type CompanyMatch = { slug: string; name: string; legal_name: string | null; partnership_status: Partnership["status"] | null; matched_name_as_listed: string | null; notes: string | null };
export type Resource = { id: string; label: string; url: string; detail: string | null };

export async function searchPartnership(q: string) {
  const supabase = await createClient();
  const [hte, companies] = await Promise.all([
    supabase.rpc("search_hte", { q }),
    supabase.rpc("search_companies", { q }),
  ]);
  if (hte.error) throw new Error(`Could not search the HTE list: ${hte.error.message}`);
  if (companies.error) throw new Error(`Could not search companies: ${companies.error.message}`);
  const rows = (hte.data ?? []) as HteMatch[];
  // strong = the words are really in the listed name; weak = only looks similar
  return {
    strong: rows.filter((r) => r.score >= 0.85),
    similar: rows.filter((r) => r.score < 0.85),
    companies: (companies.data ?? []) as CompanyMatch[],
  };
}

export async function getResources() {
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("id, label, url, detail").order("sort_order");
  return (data ?? []) as Resource[];
}

export type MoaRow = {
  id: string;
  status: string;
  requested_on: string | null;
  requested_via: string | null;
  last_update: string | null;
  notes: string | null;
  company: { slug: string; name: string } | null;
  supporters: number;
  mine: boolean;
};

export async function getMoaBoard(userId: string | null): Promise<MoaRow[]> {
  const supabase = await createClient();
  const config = await getConfig();
  const [requests, counts, mine] = await Promise.all([
    supabase.from("moa_requests").select("id, status, requested_on, requested_via, last_update, notes, company:companies(slug, name)").eq("campus", config.campus).order("requested_on", { ascending: false }),
    supabase.rpc("moa_supporter_counts"),
    userId ? supabase.from("moa_request_supporters").select("moa_request_id").eq("user_id", userId) : Promise.resolve({ data: [] as { moa_request_id: string }[] }),
  ]);
  if (requests.error) throw new Error(`Could not load MOA requests: ${requests.error.message}`);
  const count = new Map(((counts.data ?? []) as { moa_request_id: string; supporters: number }[]).map((c) => [c.moa_request_id, Number(c.supporters)]));
  const own = new Set((mine.data ?? []).map((m) => m.moa_request_id));
  return (requests.data ?? []).map((r) => ({
    ...(r as unknown as Omit<MoaRow, "supporters" | "mine">),
    supporters: count.get(r.id) ?? 0,
    mine: own.has(r.id),
  }));
}

export type EmailRow = Contact & { company: { slug: string; name: string } | null };

export async function getColdEmails() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_contacts")
    .select("id, email, purpose, status, bounce_code, notes, observed_on, company:companies(slug, name)")
    .order("status");
  if (error) throw new Error(`Could not load emails: ${error.message}`);
  const rows = (data ?? []) as unknown as EmailRow[];
  const usable = rows.filter((r) => r.status === "reply_received" || r.status === "published_untested");
  // replied-before first, then by company
  usable.sort((a, b) => Number(b.status === "reply_received") - Number(a.status === "reply_received") || (a.company?.name ?? "").localeCompare(b.company?.name ?? ""));
  return { usable, avoid: rows.filter((r) => !usable.includes(r)) };
}

// Each of these ran 2 to 3 times per page (hero, directory, top bar). cache() runs them once per request.
export const getConfig = cache(loadConfig);
export const getViewer = cache(loadViewer);
export const getDirectoryStats = cache(loadDirectoryStats);
