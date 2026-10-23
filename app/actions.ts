"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { OPEN_CHECK_RESULTS } from "@/lib/schemas";

type Result = { ok: true } | { ok: false; error: string };

async function signedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: (data?.claims?.sub as string | undefined) ?? null };
}

// Admin checks here only give a clear error; RLS is what actually blocks everyone else.
async function requireAdmin() {
  const { supabase, userId } = await signedIn();
  if (!userId) return { supabase, error: "Sign in first." };
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return { supabase, error: admin ? null : "Only admins can publish." };
}

export async function setPublished(opportunitySlug: string, publish: boolean): Promise<Result> {
  const { supabase, error: denied } = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const { data: opp, error } = await supabase
    .from("opportunities")
    .update({ is_published: publish })
    .eq("slug", opportunitySlug)
    .select("company_id")
    .maybeSingle();
  if (error || !opp) return { ok: false, error: error?.message ?? "Role not found." };

  // a published role needs its company visible too; unpublishing leaves the company alone
  if (publish) {
    const { error: companyError } = await supabase.from("companies").update({ is_published: true }).eq("id", opp.company_id);
    if (companyError) return { ok: false, error: companyError.message };
  }
  refresh();
  return { ok: true };
}

// for companies without roles (e.g. only an MOA request)
export async function setCompanyPublished(companySlug: string, publish: boolean): Promise<Result> {
  const { supabase, error: denied } = await requireAdmin();
  if (denied) return { ok: false, error: denied };
  const { data, error } = await supabase.from("companies").update({ is_published: publish }).eq("slug", companySlug).select("id").maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "Company not found." };
  refresh();
  return { ok: true };
}

// "I also need this MOA": signed-in users add or remove only their own row (RLS enforces it)
export async function setMoaSupport(moaRequestId: string, support: boolean): Promise<Result> {
  const { supabase, userId } = await signedIn();
  if (!userId) return { ok: false, error: "Sign in to add yourself." };
  const { error } = support
    ? await supabase.from("moa_request_supporters").upsert({ moa_request_id: moaRequestId, user_id: userId }, { ignoreDuplicates: true })
    : await supabase.from("moa_request_supporters").delete().eq("moa_request_id", moaRequestId).eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

// "Still open?" check from a signed-in classmate. The database keeps one per person per role per day,
// refreshes "checked" on "open", and queues an admin review after enough closed/dead reports.
export async function reportOpenCheck(opportunityId: string, result: string): Promise<Result> {
  const { supabase, userId } = await signedIn();
  if (!userId) return { ok: false, error: "Sign in to report." };
  const parsed = z.enum(OPEN_CHECK_RESULTS).safeParse(result);
  if (!parsed.success) return { ok: false, error: "Unknown answer." };
  const { error } = await supabase.from("open_checks").insert({ opportunity_id: opportunityId, user_id: userId, result: parsed.data });
  if (error?.code === "23505") return { ok: false, error: "You already checked this role today. Thanks!" };
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
