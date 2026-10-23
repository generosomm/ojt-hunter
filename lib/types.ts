// Shapes of the rows the app reads. Enum value lists mirror the Postgres enums
// (regenerate with Supabase `generate_typescript_types` when the schema changes).

export const ROLE_CATEGORIES = ["dev", "qa", "it_support", "network", "data", "cyber", "automation", "ui_ux", "business_analyst", "other"] as const;
export const SETUPS = ["onsite", "hybrid", "remote", "unknown"] as const;
export const DEV_EXPOSURES = ["high", "some", "low", "low_repetitive", "unknown"] as const;
export const POST_STATUSES = ["open", "recurring_program", "unconfirmed", "no_post_cold_email", "closed"] as const;
export const PARTNER_STATUSES = ["listed_in_hte", "confirmed_by_school", "confirmed_by_company"] as const;

export type RoleCategory = (typeof ROLE_CATEGORIES)[number];
export type Setup = (typeof SETUPS)[number];
export type DevExposure = (typeof DEV_EXPOSURES)[number];
export type PostStatus = (typeof POST_STATUSES)[number];
export type PartnershipStatus = (typeof PARTNER_STATUSES)[number] | "not_listed" | "moa_requested" | "needs_clarification";
export type AllowanceStatus = "disclosed" | "not_disclosed" | "unpaid" | "benefits_only";
export type AllowanceBasis = "per_day" | "per_month" | "per_hour" | "unknown";
export type YesNoAsk = "yes" | "no" | "ask";
export type ContactStatus = "reply_received" | "published_untested" | "bounced" | "wrong_purpose";
export type ContactPurpose = "resume_intake" | "questions_only" | "help_desk" | "unknown";
export type FactState = "confirmed" | "reported" | "historical" | "unknown";

export type AppConfig = {
  campus: string;
  hte_list_version: string;
  working_days_per_month: number;
  hours_per_day: number;
  default_required_hours: number;
  stale_after_days: number;
  timezone: string;
};

export type Listing = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  company_slug: string;
  role_category: RoleCategory;
  city: string | null;
  setup: Setup;
  onsite_days_per_week: number | null;
  employment_type: "full_time" | "part_time" | "unknown";
  dev_exposure: DevExposure;
  allowance_status: AllowanceStatus;
  allowance_basis: AllowanceBasis;
  allowance_amount: number | null;
  allowance_per_day_low: number | null;
  allowance_per_day_high: number | null;
  required_hours_min: number | null;
  required_hours_max: number | null;
  accepts_nov_start: YesNoAsk;
  post_status: PostStatus;
  last_checked_at: string | null;
  needs_recheck: boolean;
  partnership_status: PartnershipStatus | null;
  is_published: boolean;
  created_at: string;
};

export type OpportunityDetail = Listing & {
  company_id: string;
  duties: string | null;
  tech_stack: string[];
  office_address: string | null;
  moa_requirement: "existing_campus_moa_required" | "new_partner_ok" | "own_company_moa" | "unknown";
  schedule_text: string | null;
  allowance_min: number | null;
  allowance_max: number | null;
  allowance_source: string | null;
  allowance_verified: boolean;
  duration_text: string | null;
  intake_text: string | null;
  school_requirements: string | null;
  apply_url: string | null;
  apply_channel: string;
  apply_instructions: string | null;
  source_url: string | null;
  notes: string | null;
  matched_name_as_listed: string | null;
};

export type Company = {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  website: string | null;
  careers_url: string | null;
  industry: string | null;
  hq_location: string | null;
  description: string | null;
  founded_year: string | null;
  size_text: string | null;
  background_source: string | null;
  is_published: boolean;
};

export type Partnership = {
  id: string;
  status: PartnershipStatus;
  matched_name_as_listed: string | null;
  source: string | null;
  notes: string | null;
  // the HTE list version the match came from (may be older than the current list)
  hte_entry: { list_version: string } | null;
};

export type Contact = {
  id: string;
  email: string;
  purpose: ContactPurpose;
  status: ContactStatus;
  bounce_code: string | null;
  notes: string | null;
  observed_on: string | null;
};

export type Fact = {
  id: string;
  field: string;
  value: string;
  source_url: string | null;
  source_type: string;
  state: FactState;
  observed_on: string | null;
};
