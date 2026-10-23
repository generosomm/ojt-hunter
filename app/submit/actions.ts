"use server";

import { currentUser } from "@/lib/me";
import { fieldErrors, newRoleSchema, roleUpdateSchema, type FieldErrors } from "@/lib/schemas";

export type SubmitState = { ok: boolean; message?: string; errors?: FieldErrors };

const fromForm = (form: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));

// everything lands as "pending"; RLS only lets you submit as yourself
export async function submitNewRole(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, message: "Sign in first." };
  const parsed = newRoleSchema.safeParse(
    fromForm(form, ["company", "title", "apply_url", "city", "setup", "allowance", "notes", "evidence_url", "evidence_note"]),
  );
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  const { evidence_url, evidence_note, ...payload } = parsed.data;
  const { error } = await supabase
    .from("submissions")
    .insert({ type: "new_opportunity", payload, evidence_url: evidence_url ?? payload.apply_url, evidence_note, submitted_by: userId });
  if (error) return { ok: false, message: `Could not send: ${error.message}` };
  return { ok: true, message: "Sent for review. Thanks!" };
}

export async function submitRoleUpdate(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return { ok: false, message: "Sign in first." };
  const parsed = roleUpdateSchema.safeParse(fromForm(form, ["role", "type", "value", "email", "evidence_url", "evidence_note"]));
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", errors: fieldErrors(parsed.error) };
  const { role, type, value, email, evidence_url, evidence_note } = parsed.data;

  const { data: opp } = await supabase.from("opportunity_listing").select("id, company_id").eq("slug", role).maybeSingle();
  if (!opp) return { ok: false, message: "That role was not found.", errors: { role: "Pick a role from the list." } };

  const { error } = await supabase.from("submissions").insert({
    type,
    opportunity_id: opp.id,
    company_id: opp.company_id,
    payload: email ? { value, email } : { value },
    evidence_url,
    evidence_note,
    submitted_by: userId,
  });
  if (error) return { ok: false, message: `Could not send: ${error.message}` };
  return { ok: true, message: "Sent for review. Thanks!" };
}
