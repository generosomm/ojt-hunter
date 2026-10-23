"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Admin only. RLS rejects the update for anyone else; the check here just gives a clear error.
export async function setPublished(opportunitySlug: string, publish: boolean) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { ok: false, error: "Sign in first." };
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!admin) return { ok: false, error: "Only admins can publish." };

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
