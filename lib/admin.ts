// Admin reads. The page checks isAdmin for a clear message; RLS is what actually limits the data.
import { allowanceHeadline, hoursText } from "./format";
import { partnerLabel, postLabel } from "./labels";
import { currentUser } from "./me";
import type { Listing, PartnershipStatus, PostStatus } from "./types";

export async function adminSession() {
  const { supabase, userId } = await currentUser();
  if (!userId) return { supabase, userId, isAdmin: false };
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return { supabase, userId, isAdmin: Boolean(data) };
}

export type QueueItem = {
  id: string;
  type: string;
  created_at: string;
  evidence_url: string | null;
  evidence_note: string | null;
  role: { slug: string; title: string; company_name: string } | null;
  rows: { label: string; current: string; proposed: string }[];
};

type Sub = {
  id: string;
  type: string;
  created_at: string;
  payload: Record<string, string | number | null>;
  evidence_url: string | null;
  evidence_note: string | null;
  opportunity_id: string | null;
  company_id: string | null;
};

const s = (v: unknown) => (v == null || v === "" ? "Not set" : String(v));

export async function getQueue(): Promise<QueueItem[]> {
  const { supabase } = await currentUser();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, type, created_at, payload, evidence_url, evidence_note, opportunity_id, company_id")
    .eq("status", "pending")
    .order("created_at");
  if (error) throw new Error(`Could not load the queue: ${error.message}`);
  const subs = (data ?? []) as Sub[];

  const oppIds = [...new Set(subs.map((x) => x.opportunity_id).filter(Boolean))] as string[];
  const { data: opps } = oppIds.length
    ? await supabase
        .from("opportunity_listing")
        .select("id, slug, title, company_name, post_status, partnership_status, allowance_status, allowance_per_day_low, allowance_per_day_high, allowance_amount, allowance_source, required_hours_min, required_hours_max, intake_text, company_id")
        .in("id", oppIds)
    : { data: [] };
  const byId = new Map((opps ?? []).map((o) => [o.id as string, o as Listing & { allowance_source: string | null; intake_text: string | null; company_id: string }]));

  const contacts = new Map<string, string>();
  const bounced = subs.filter((x) => x.type === "email_bounced" && x.company_id);
  if (bounced.length) {
    const { data: c } = await supabase.from("company_contacts").select("company_id, email, status").in("company_id", bounced.map((x) => x.company_id!));
    for (const row of c ?? []) contacts.set(`${row.company_id}:${String(row.email).toLowerCase()}`, row.status as string);
  }

  return subs.map((x) => {
    const o = x.opportunity_id ? byId.get(x.opportunity_id) : undefined;
    const value = s(x.payload.value);
    let rows: QueueItem["rows"] = [];
    switch (x.type) {
      case "new_opportunity":
        rows = (["company", "title", "city", "setup", "allowance", "apply_url", "notes"] as const)
          .filter((k) => x.payload[k])
          .map((k) => ({ label: k.replace("_", " "), current: "New", proposed: s(x.payload[k]) }));
        break;
      case "post_closed":
        rows = [{ label: "Post", current: o ? postLabel[o.post_status as PostStatus] : "Not set", proposed: "Closed" }];
        if (x.payload.reports) rows.push({ label: "Reports", current: "", proposed: `${x.payload.reports} classmates` });
        break;
      case "allowance_confirmed":
        rows = [{ label: "Pay", current: o ? `${allowanceHeadline(o).main} ${allowanceHeadline(o).unit}`.trim() : "Not set", proposed: value }];
        break;
      case "hours_confirmed":
        rows = [{ label: "Hours / start", current: o ? [hoursText(o.required_hours_min, o.required_hours_max), o.intake_text].filter(Boolean).join(", ") || "Not set" : "Not set", proposed: value }];
        break;
      case "moa_clarification":
        rows = [{ label: "Partner", current: o?.partnership_status ? partnerLabel[o.partnership_status as PartnershipStatus] : "Not set", proposed: value }];
        break;
      case "email_bounced": {
        const email = String(x.payload.email ?? "").toLowerCase();
        rows = [
          { label: "Email", current: `${email} (${contacts.get(`${x.company_id}:${email}`)?.replace("_", " ") ?? "not in our list"})`, proposed: "bounced" },
          { label: "Note", current: "", proposed: value },
        ];
        break;
      }
      default:
        rows = [{ label: "Correction", current: "", proposed: value }];
    }
    return {
      id: x.id,
      type: x.type,
      created_at: x.created_at,
      evidence_url: x.evidence_url,
      evidence_note: x.evidence_note,
      role: o ? { slug: o.slug, title: o.title, company_name: o.company_name } : null,
      rows,
    };
  });
}
