"use server";

import { refresh } from "next/cache";
import { getConfig } from "@/lib/data";
import { currentUser, todayIn } from "@/lib/me";
import {
  CHECKLIST_STATUSES,
  PROFILE_FIELDS,
  applicationEditSchema,
  fieldErrors,
  manualApplicationSchema,
  profileSchema,
  type FieldErrors,
} from "@/lib/schemas";

export type FormState = { ok: boolean; message?: string; errors?: FieldErrors };
type Result = { ok: true } | { ok: false; error: string };

const fromForm = (form: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));
const NOT_SIGNED_IN = "Sign in first.";

export async function saveProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, message: NOT_SIGNED_IN };
  const parsed = profileSchema.safeParse(fromForm(form, PROFILE_FIELDS));
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  const { error } = await supabase.from("profiles").upsert({ user_id: userId, ...parsed.data }, { onConflict: "user_id" });
  if (error) return { ok: false, message: `Could not save: ${error.message}` };
  refresh();
  return { ok: true, message: "Profile saved" };
}

export async function addManualApplication(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, message: NOT_SIGNED_IN };
  const parsed = manualApplicationSchema.safeParse(fromForm(form, ["company_name_manual", "role_manual", "status"]));
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  const { error } = await supabase.from("applications").insert({ user_id: userId, ...parsed.data });
  if (error) return { ok: false, message: `Could not add: ${error.message}` };
  refresh();
  return { ok: true, message: "Added to your tracker" };
}

export async function updateApplication(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, message: NOT_SIGNED_IN };
  const parsed = applicationEditSchema.safeParse(fromForm(form, Object.keys(applicationEditSchema.shape)));
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  // datetime-local has no zone; the app's zone is Asia/Manila (UTC+8, no daylight saving)
  const patch = { ...parsed.data, interview_at: parsed.data.interview_at ? new Date(`${parsed.data.interview_at}:00+08:00`).toISOString() : null };
  const { data, error } = await supabase.from("applications").update(patch).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: error ? `Could not save: ${error.message}` : "Not found." };
  refresh();
  return { ok: true, message: "Saved" };
}

export async function setApplicationStatus(id: string, status: string): Promise<Result> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, error: NOT_SIGNED_IN };
  const parsed = applicationEditSchema.shape.status.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Unknown status." };
  const { data, error } = await supabase.from("applications").update({ status: parsed.data }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "Not found." };
  refresh();
  return { ok: true };
}

export async function deleteApplication(id: string): Promise<Result> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, error: NOT_SIGNED_IN };
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function saveRoleToTracker(opportunityId: string): Promise<Result> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, error: "Sign in to save roles." };
  const { error } = await supabase
    .from("applications")
    .upsert({ user_id: userId, opportunity_id: opportunityId, status: "saved" }, { onConflict: "user_id,opportunity_id", ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function setChecklistStatus(itemKey: string, status: string): Promise<Result> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, error: NOT_SIGNED_IN };
  if (!(CHECKLIST_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Unknown status." };
  const done_on = status === "done" ? todayIn((await getConfig()).timezone) : null;
  const { data, error } = await supabase
    .from("deployment_checklist")
    .update({ status: status as (typeof CHECKLIST_STATUSES)[number], done_on })
    .eq("user_id", userId)
    .eq("item_key", itemKey)
    .select("item_key")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "Not found." };
  refresh();
  return { ok: true };
}
