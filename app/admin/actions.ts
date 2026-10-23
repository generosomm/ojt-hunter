"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { adminSession } from "@/lib/admin";
import { fieldErrors, partnershipEditSchema, roleEditSchema, type FieldErrors } from "@/lib/schemas";

type Result = { ok: true; message?: string } | { ok: false; error: string };
export type EditState = { ok: boolean; message?: string; errors?: FieldErrors };

// the database function checks admin again and applies the change in one transaction
export async function reviewSubmission(id: string, approve: boolean): Promise<Result> {
  const { supabase, isAdmin } = await adminSession();
  if (!isAdmin) return { ok: false, error: "Only admins can review." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown item." };
  const { error } = await supabase.rpc("review_submission", { sub_id: id, approve });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: approve ? "Approved" : "Rejected" };
}

export async function updateRole(slug: string, _prev: EditState, form: FormData): Promise<EditState> {
  const { supabase, isAdmin } = await adminSession();
  if (!isAdmin) return { ok: false, message: "Only admins can edit." };
  // unticked checkboxes send nothing, so they default to off
  const raw = { allowance_verified: "", mark_checked: "", ...Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) };
  const parsed = roleEditSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  const { mark_checked, ...patch } = parsed.data;
  const { error, data } = await supabase
    .from("opportunities")
    .update({ ...patch, ...(mark_checked ? { last_checked_at: new Date().toISOString() } : {}) })
    .eq("slug", slug)
    .select("slug")
    .maybeSingle();
  if (error || !data) return { ok: false, message: error ? `Could not save: ${error.message}` : "Role not found." };
  refresh();
  return { ok: true, message: "Role saved" };
}

const roleRow = z.object({
  company: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(160),
  apply_url: z.string().trim().max(500).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  setup: z.enum(["onsite", "hybrid", "remote", "unknown", ""]).optional().default(""),
  allowance: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
});

// each row goes through the same review path as a classmate submission, so it lands as a draft with a trail
export async function importRoles(rows: unknown[]): Promise<Result> {
  const { supabase, userId, isAdmin } = await adminSession();
  if (!isAdmin || !userId) return { ok: false, error: "Only admins can import." };
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: "The file has no rows." };
  // small batches keep each import well inside the hosting time limit
  if (rows.length > 100) return { ok: false, error: "Import at most 100 rows at a time." };

  const parsed = rows.map((r) => roleRow.safeParse(r));
  const bad = parsed.findIndex((p) => !p.success);
  if (bad >= 0) return { ok: false, error: `Row ${bad + 2}: needs a company and a role title (and setup must be onsite, hybrid, remote or blank).` };

  // skip roles that already exist (or repeat in the file), so re-running a file never duplicates
  const key = (company: string, title: string) => `${company}|${title}`.toLowerCase().replace(/[^a-z0-9|]+/g, "");
  const { data: existing } = await supabase.from("opportunity_listing").select("company_name, title");
  const seen = new Set((existing ?? []).map((o) => key(String(o.company_name), String(o.title))));

  let added = 0;
  let skipped = 0;
  for (const p of parsed) {
    const k = key(p.data!.company, p.data!.title);
    if (seen.has(k)) {
      skipped++;
      continue;
    }
    seen.add(k);
    const { apply_url, ...payload } = p.data!;
    const url = /^https:\/\/\S+$/.test(apply_url) ? apply_url : "";
    const { data: sub, error } = await supabase
      .from("submissions")
      .insert({ type: "new_opportunity", payload: { ...payload, apply_url: url, setup: payload.setup || "unknown" }, evidence_url: url || null, evidence_note: "CSV import", submitted_by: userId })
      .select("id")
      .single();
    if (error) return { ok: false, error: `Stopped after ${added} rows: ${error.message}` };
    const { error: reviewError } = await supabase.rpc("review_submission", { sub_id: sub.id, approve: true });
    if (reviewError) return { ok: false, error: `Stopped after ${added} rows: ${reviewError.message}` };
    added++;
  }
  refresh();
  return { ok: true, message: `Imported ${added} roles as drafts${skipped ? `, skipped ${skipped} already listed` : ""}.` };
}

export async function importHte(version: string, entries: { no: number; name: string }[], makeCurrent: boolean): Promise<Result> {
  const { supabase, isAdmin } = await adminSession();
  if (!isAdmin) return { ok: false, error: "Only admins can import." };
  const v = z.string().trim().min(3).max(40).safeParse(version);
  if (!v.success) return { ok: false, error: "Add a version name, e.g. AY 2027-2028." };
  const list = z.array(z.object({ no: z.number().int().positive(), name: z.string().trim().min(1).max(200) })).max(3000).safeParse(entries);
  if (!list.success || list.data.length === 0) return { ok: false, error: "Each row needs a number (no) and a name (company_name_as_listed)." };
  const { data, error } = await supabase.rpc("admin_import_hte", { version: v.data, entries: list.data, make_current: makeCurrent });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: `Imported ${data} entries${makeCurrent ? " and made it the current list" : ""}.` };
}

// admin edit of a company's partnership for this campus and its MOA request
export async function updatePartnership(slug: string, _prev: EditState, form: FormData): Promise<EditState> {
  const { supabase, userId, isAdmin } = await adminSession();
  if (!isAdmin || !userId) return { ok: false, message: "Only admins can edit." };
  const parsed = partnershipEditSchema.safeParse(Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])));
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  const { moa_status, moa_notes, ...p } = parsed.data;

  const [{ data: company }, { data: cfg }] = await Promise.all([
    supabase.from("companies").select("id").eq("slug", slug).maybeSingle(),
    supabase.from("app_config").select("campus, timezone").single(),
  ]);
  if (!company || !cfg) return { ok: false, message: "Company not found." };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timezone }).format(new Date());

  // update-or-insert by hand: an upsert (ON CONFLICT DO UPDATE) needs table-wide read access,
  // which this table deliberately doesn't grant (updated_by stays private)
  const fields = { ...p, source: "Admin update", source_date: today, updated_by: userId };
  const { data: current } = await supabase.from("partnerships").select("id").eq("company_id", company.id).eq("campus", cfg.campus).maybeSingle();
  const { error } = current
    ? await supabase.from("partnerships").update(fields).eq("id", current.id)
    : await supabase.from("partnerships").insert({ company_id: company.id, campus: cfg.campus, ...fields });
  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  // "none" never deletes an existing request; it only means "don't create one"
  if (moa_status !== "none") {
    const { data: existing } = await supabase.from("moa_requests").select("id").eq("company_id", company.id).eq("campus", cfg.campus).maybeSingle();
    const { error: moaError } = existing
      ? await supabase.from("moa_requests").update({ status: moa_status, notes: moa_notes, last_update: today }).eq("id", existing.id)
      : await supabase.from("moa_requests").insert({ company_id: company.id, campus: cfg.campus, status: moa_status, notes: moa_notes, requested_on: today, last_update: today, created_by: userId });
    if (moaError) return { ok: false, message: `Partnership saved, MOA not saved: ${moaError.message}` };
  }
  refresh();
  return { ok: true, message: "Partnership saved" };
}
