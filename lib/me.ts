// Private, per-user reads. RLS limits every query to the signed-in user's own rows.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "./schemas";

async function loadCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;
  return { supabase, userId };
}

export type Profile = {
  display_name: string | null;
  full_name: string | null;
  school: string | null;
  campus: string | null;
  program: string | null;
  year_level: string | null;
  required_hours: number | null;
  max_hours: number | null;
  available_from: string | null;
  expected_graduation: string | null;
  preferred_cities: string[];
  min_allowance_per_day: number | null;
  location_base: string | null;
  willing_to_relocate: boolean | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  projects: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  fic_name: string | null;
};

async function loadProfile(): Promise<Profile | null> {
  const { supabase, userId } = await currentUser();
  if (!userId) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  return (data as Profile | null) ?? null;
}

export type Application = {
  id: string;
  opportunity_id: string | null;
  company_name_manual: string | null;
  role_manual: string | null;
  status: ApplicationStatus;
  applied_on: string | null;
  channel: string | null;
  follow_up_on: string | null;
  interview_at: string | null;
  interview_link: string | null;
  confirmed_allowance: string | null;
  confirmed_schedule: string | null;
  notes: string | null;
  decline_reason: string | null;
  updated_at: string;
  opportunity: { slug: string; title: string; company_name: string } | null;
};

export async function getApplications(): Promise<Application[]> {
  const { supabase, userId } = await currentUser();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("applications")
    .select("id, opportunity_id, company_name_manual, role_manual, status, applied_on, channel, follow_up_on, interview_at, interview_link, confirmed_allowance, confirmed_schedule, notes, decline_reason, updated_at, opportunity:opportunity_listing(slug, title, company_name)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load your tracker: ${error.message}`);
  return (data ?? []) as unknown as Application[];
}

export type ChecklistItem = {
  item_key: string;
  status: "todo" | "in_progress" | "done" | "na";
  done_on: string | null;
  template: { label: string; detail: string | null; can_do_without_company: boolean; sort_order: number } | null;
};

export async function getChecklist(): Promise<ChecklistItem[]> {
  const { supabase, userId } = await currentUser();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("deployment_checklist")
    .select("item_key, status, done_on, template:checklist_templates(label, detail, can_do_without_company, sort_order)");
  if (error) throw new Error(`Could not load your checklist: ${error.message}`);
  const rows = (data ?? []) as unknown as ChecklistItem[];
  return rows.sort((a, b) => (a.template?.sort_order ?? 0) - (b.template?.sort_order ?? 0));
}

export async function getSavedOpportunityIds(): Promise<Set<string>> {
  const { supabase, userId } = await currentUser();
  if (!userId) return new Set();
  const { data } = await supabase.from("applications").select("opportunity_id").not("opportunity_id", "is", null);
  return new Set((data ?? []).map((r) => r.opportunity_id as string));
}

export function todayIn(timeZone: string) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// one auth check and one profile read per request, however many components ask
export const currentUser = cache(loadCurrentUser);
export const getProfile = cache(loadProfile);
