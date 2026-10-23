// Server-side reads. Every query runs as the visitor, so Row Level Security decides what they see:
// the public gets published rows only, admins also get drafts.
import { createClient } from "@/lib/supabase/server";
import type { Filters } from "./filters";
import { fitsHours } from "./format";
import { PARTNER_STATUSES, type AppConfig, type Company, type Contact, type Fact, type Listing, type OpportunityDetail, type Partnership } from "./types";

const LISTING_COLUMNS =
  "id, slug, title, company_name, company_slug, role_category, city, setup, onsite_days_per_week, employment_type, dev_exposure, allowance_status, allowance_basis, allowance_amount, allowance_per_day_low, allowance_per_day_high, required_hours_min, required_hours_max, accepts_nov_start, post_status, last_checked_at, needs_recheck, partnership_status, is_published, created_at";

export type Viewer = { userId: string | null; isAdmin: boolean; requiredHours: number; maxHours: number; hasProfileHours: boolean };

export async function getConfig(): Promise<AppConfig> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_config")
    .select("campus, hte_list_version, working_days_per_month, hours_per_day, default_required_hours, stale_after_days, timezone")
    .single();
  if (error || !data) throw new Error(`Could not load app settings: ${error?.message ?? "no row"}`);
  return data as AppConfig;
}

export async function getViewer(config: AppConfig): Promise<Viewer> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;
  const fallback = { userId, isAdmin: false, requiredHours: config.default_required_hours, maxHours: config.default_required_hours, hasProfileHours: false };
  if (!userId) return fallback;

  const [admin, profile] = await Promise.all([
    supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("required_hours, max_hours").eq("user_id", userId).maybeSingle(),
  ]);
  const required = profile.data?.required_hours ?? config.default_required_hours;
  return {
    userId,
    isAdmin: Boolean(admin.data),
    requiredHours: required,
    maxHours: Math.max(profile.data?.max_hours ?? required, required),
    hasProfileHours: profile.data?.required_hours != null,
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
  if (f.fits) rows = rows.filter((r) => fitsHours(r.required_hours_min, r.required_hours_max, viewer.requiredHours, viewer.maxHours) !== false);
  return rows;
}

export async function getDirectoryStats() {
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
    supabase.from("partnerships").select("id, status, matched_name_as_listed, source, notes").eq("company_id", company.id).eq("campus", config.campus).maybeSingle(),
    supabase.from("company_contacts").select("id, email, purpose, status, bounce_code, notes, observed_on").eq("company_id", company.id),
    supabase.from("opportunity_listing").select(LISTING_COLUMNS).eq("company_id", company.id).order("post_status"),
    supabase.from("moa_requests").select("id, status, requested_on").eq("company_id", company.id).eq("campus", config.campus).maybeSingle(),
  ]);
  return {
    company,
    config,
    partnership: (partnership.data ?? null) as Partnership | null,
    contacts: (contacts.data ?? []) as Contact[],
    roles: (roles.data ?? []) as Listing[],
    moa: moa.data as { id: string; status: string; requested_on: string | null } | null,
  };
}
