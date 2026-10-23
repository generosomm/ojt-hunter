import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

// public pages plus every published role and company (read as an anonymous visitor)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "/partnership-checker", "/moa-board", "/cold-emails", "/templates", "/form-tips", "/privacy"].map((p) => ({
    url: `${site}${p}`,
  }));
  if (!supabaseUrl || !supabaseKey) return pages;

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const [roles, companies] = await Promise.all([
    supabase.from("opportunity_listing").select("slug, updated_at"),
    supabase.from("companies").select("slug, updated_at"),
  ]);
  return [
    ...pages,
    ...(roles.data ?? []).map((r) => ({ url: `${site}/opportunities/${r.slug}`, lastModified: r.updated_at as string })),
    ...(companies.data ?? []).map((c) => ({ url: `${site}/companies/${c.slug}`, lastModified: c.updated_at as string })),
  ];
}
