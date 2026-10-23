// Builds the values a template is filled with: the signed-in user's profile + the chosen role.
// Nothing is invented: anything unknown stays empty, and the fill engine shows it as [marker].
import { createClient } from "@/lib/supabase/server";
import { getConfig, getOpportunity } from "./data";
import { buildQuestions, employerSubject, projectsBlock, type Values } from "./fill";
import { channelLabel } from "./labels";
import { currentUser, getProfile } from "./me";
import type { Contact } from "./types";

export type Template = {
  key: string;
  name: string;
  use_when: string;
  subject: string | null;
  body: string;
  needs_resume: boolean;
  asks_questions: boolean;
};

export type RoleOption = { slug: string; label: string };

export type StudioData = {
  templates: Template[];
  roles: RoleOption[];
  values: Values;
  signedIn: boolean;
  hasProfile: boolean;
  role: null | {
    slug: string;
    companySlug: string;
    applyChannel: string;
    subjectFormat: string | null;
    usable: Pick<Contact, "email" | "purpose">[];
    avoid: Pick<Contact, "email" | "status">[];
  };
};

const longDate = (d: string | null | undefined) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

export async function getStudioData(roleSlug: string | null): Promise<StudioData> {
  const supabase = await createClient();
  const [templates, roles, config, { userId }] = await Promise.all([
    supabase.from("email_templates").select("key, name, use_when, subject, body, needs_resume, asks_questions").order("sort_order"),
    supabase.from("opportunity_listing").select("slug, title, company_name").order("company_name"),
    getConfig(),
    currentUser(),
  ]);
  if (templates.error) throw new Error(`Could not load templates: ${templates.error.message}`);

  const profile = userId ? await getProfile() : null;
  const opp = roleSlug ? await getOpportunity(roleSlug) : null;
  const o = opp?.opp ?? null;

  const requiredHours = profile?.required_hours ?? config.default_required_hours;
  const maxHours = Math.max(profile?.max_hours ?? requiredHours, requiredHours);
  const campus = profile?.campus ?? config.campus;

  let appliedOn: string | null = null;
  let usable: Pick<Contact, "email" | "purpose">[] = [];
  let avoid: Pick<Contact, "email" | "status">[] = [];
  if (o) {
    const [app, contacts] = await Promise.all([
      userId ? supabase.from("applications").select("applied_on").eq("opportunity_id", o.id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("company_contacts").select("email, purpose, status").eq("company_id", o.company_id),
    ]);
    appliedOn = (app.data as { applied_on: string | null } | null)?.applied_on ?? null;
    const rows = (contacts.data ?? []) as Pick<Contact, "email" | "purpose" | "status">[];
    usable = rows.filter((c) => c.status === "reply_received" || c.status === "published_untested").map(({ email, purpose }) => ({ email, purpose }));
    avoid = rows.filter((c) => c.status === "bounced" || c.status === "wrong_purpose").map(({ email, status }) => ({ email, status }));
  }

  const fullName = profile?.full_name ?? "";
  const values: Values = {
    company: o?.company_name,
    role: o?.title,
    source: o ? channelLabel[o.apply_channel] : null,
    full_name: fullName,
    first_name: fullName.split(" ")[0],
    program: profile?.program,
    year_level: profile?.year_level,
    school: profile?.school,
    campus,
    required_hours: requiredHours,
    max_hours: profile?.max_hours,
    available_from: longDate(profile?.available_from),
    projects: projectsBlock(profile?.projects ?? null),
    skills: profile?.skills?.join(", "),
    portfolio_url: profile?.portfolio_url,
    email: profile?.email,
    phone: profile?.phone,
    applied_on: longDate(appliedOn),
    questions: o
      ? buildQuestions(o, { requiredHours, maxHours, availableFrom: profile?.available_from ?? null, campus })
      : null,
  };

  return {
    templates: (templates.data ?? []) as Template[],
    roles: (roles.data ?? []).map((r) => ({ slug: r.slug as string, label: `${r.company_name} - ${r.title}` })),
    values,
    signedIn: Boolean(userId),
    hasProfile: Boolean(profile?.full_name),
    role: o
      ? {
          slug: o.slug,
          companySlug: o.company_slug,
          applyChannel: o.apply_channel,
          subjectFormat: employerSubject(o.apply_instructions, o.title, fullName),
          usable,
          avoid,
        }
      : null,
  };
}
