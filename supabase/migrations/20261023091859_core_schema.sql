-- OJT Hunter core schema (P1).
-- Rules: unknown stays unknown, every key fact can carry a source, nothing about a user is public.

create extension if not exists pg_trgm with schema extensions;
create schema if not exists private;

-- ---------- enums ----------
create type public.apply_route as enum ('direct_hr_email','portal_only','form','referral','unknown');
create type public.contact_purpose as enum ('resume_intake','questions_only','help_desk','unknown');
create type public.contact_status as enum ('reply_received','published_untested','bounced','wrong_purpose');
create type public.fact_entity as enum ('company','opportunity','partnership');
create type public.fact_source_type as enum ('official_post','company_site','hr_reply','employee_review','employer_marketing','classmate_report','school_document');
create type public.fact_state as enum ('confirmed','reported','historical','unknown');
create type public.partnership_status as enum ('listed_in_hte','confirmed_by_school','confirmed_by_company','not_listed','moa_requested','needs_clarification');
create type public.moa_status as enum ('requested','in_progress','approved','rejected','unknown');
create type public.role_category as enum ('dev','qa','it_support','network','data','cyber','automation','ui_ux','business_analyst','other');
-- 'low' = little dev work but varied (IT support); 'low_repetitive' = repetitive (ticket queues, scoring)
create type public.dev_exposure as enum ('high','some','low','low_repetitive','unknown');
create type public.work_setup as enum ('onsite','hybrid','remote','unknown');
create type public.employment_type as enum ('full_time','part_time','unknown');
create type public.moa_requirement as enum ('existing_campus_moa_required','new_partner_ok','own_company_moa','unknown');
create type public.allowance_basis as enum ('per_day','per_month','per_hour','unknown');
create type public.allowance_status as enum ('disclosed','not_disclosed','unpaid','benefits_only');
create type public.yes_no_ask as enum ('yes','no','ask');
create type public.apply_channel as enum ('jobstreet','linkedin','indeed','prosple','kalibrr','bossjob','company_portal','email','forms','facebook','other');
create type public.post_status as enum ('open','closed','unconfirmed','recurring_program','no_post_cold_email');
create type public.open_check_result as enum ('opened_and_open','opened_but_closed','link_dead','redirected');
create type public.submission_type as enum ('new_opportunity','post_closed','email_bounced','allowance_confirmed','hours_confirmed','moa_clarification','correction');
create type public.review_status as enum ('pending','approved','rejected');
create type public.application_status as enum ('saved','applied','assessment','interview','offered','accepted','declined','rejected','withdrawn','closed');
create type public.checklist_status as enum ('todo','in_progress','done','na');

-- ---------- helpers ----------
create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- app config (single row, edited by admin, never hardcoded in the app) ----------
create table public.app_config (
  id boolean primary key default true check (id),
  campus text not null,
  hte_list_version text not null,
  hte_list_date date,
  -- school asked to approve before the list is public; flip here, no code change
  hte_list_public boolean not null default false,
  working_days_per_month int not null default 22 check (working_days_per_month between 1 and 31),
  hours_per_day int not null default 8 check (hours_per_day between 1 and 24),
  default_required_hours int not null default 600 check (default_required_hours > 0),
  stale_after_days int not null default 14 check (stale_after_days > 0),
  timezone text not null default 'Asia/Manila',
  updated_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- companies ----------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  legal_name text,
  aliases text[] not null default '{}',
  website text,
  careers_url text,
  industry text,
  hq_location text,
  description text,
  founded_year text,
  size_text text,
  background_source text,
  background_checked_on date,
  apply_route public.apply_route not null default 'unknown',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index companies_name_trgm on public.companies using gin (name extensions.gin_trgm_ops);

-- only company-published addresses, never personal ones from private replies
create table public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  purpose public.contact_purpose not null default 'unknown',
  status public.contact_status not null default 'published_untested',
  bounce_code text,
  source text,
  observed_on date,
  notes text,
  unique (company_id, email)
);
create index company_contacts_company_idx on public.company_contacts (company_id);

-- ---------- school HTE list ----------
create table public.hte_list_entries (
  id bigint generated always as identity primary key,
  list_version text not null,
  entry_no int not null,
  name_as_listed text not null,
  normalized_name text not null,
  unique (list_version, entry_no)
);
create index hte_list_entries_name_trgm on public.hte_list_entries using gin (normalized_name extensions.gin_trgm_ops);

create table public.partnerships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  campus text not null,
  status public.partnership_status not null,
  hte_entry_id bigint references public.hte_list_entries (id) on delete set null,
  matched_name_as_listed text,
  source text,
  source_date date,
  notes text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (company_id, campus)
);
create index partnerships_hte_entry_idx on public.partnerships (hte_entry_id);
create index partnerships_updated_by_idx on public.partnerships (updated_by);

-- ---------- MOA board ----------
create table public.moa_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  campus text not null,
  status public.moa_status not null default 'requested',
  requested_on date,
  requested_via text,
  last_update date,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, campus)
);
create index moa_requests_created_by_idx on public.moa_requests (created_by);

create table public.moa_request_supporters (
  moa_request_id uuid not null references public.moa_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moa_request_id, user_id)
);
create index moa_request_supporters_user_idx on public.moa_request_supporters (user_id);

-- ---------- opportunities ----------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  role_category public.role_category not null default 'other',
  duties text,
  tech_stack text[] not null default '{}',
  dev_exposure public.dev_exposure not null default 'unknown',
  city text,
  office_address text,
  setup public.work_setup not null default 'unknown',
  onsite_days_per_week int check (onsite_days_per_week between 0 and 7),
  employment_type public.employment_type not null default 'unknown',
  moa_requirement public.moa_requirement not null default 'unknown',
  schedule_text text,
  allowance_amount numeric(12,2) check (allowance_amount >= 0),
  allowance_min numeric(12,2) check (allowance_min >= 0),
  allowance_max numeric(12,2) check (allowance_max >= 0),
  allowance_basis public.allowance_basis not null default 'unknown',
  allowance_status public.allowance_status not null default 'not_disclosed',
  allowance_source text,
  allowance_verified boolean not null default false,
  required_hours_min int check (required_hours_min > 0),
  required_hours_max int check (required_hours_max > 0),
  duration_text text,
  intake_text text,
  earliest_start date,
  deadline date,
  accepts_nov_start public.yes_no_ask not null default 'ask',
  school_requirements text,
  apply_url text,
  apply_channel public.apply_channel not null default 'other',
  apply_instructions text,
  post_status public.post_status not null default 'unconfirmed',
  last_checked_at timestamptz,
  last_checked_by uuid references auth.users (id) on delete set null,
  source_url text,
  notes text,
  is_published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (allowance_min is null or allowance_max is null or allowance_min <= allowance_max),
  check (required_hours_min is null or required_hours_max is null or required_hours_min <= required_hours_max),
  -- an amount only makes sense when the allowance is disclosed
  check (allowance_status = 'disclosed' or (allowance_amount is null and allowance_min is null and allowance_max is null))
);
create index opportunities_company_idx on public.opportunities (company_id);
create index opportunities_published_idx on public.opportunities (is_published, post_status);
create index opportunities_last_checked_by_idx on public.opportunities (last_checked_by);
create index opportunities_created_by_idx on public.opportunities (created_by);

-- evidence trail; conflicting values stay side by side
create table public.fact_sources (
  id uuid primary key default gen_random_uuid(),
  entity public.fact_entity not null,
  entity_id uuid not null,
  field text not null,
  value text not null,
  source_url text,
  source_type public.fact_source_type not null,
  state public.fact_state not null default 'reported',
  observed_on date,
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index fact_sources_entity_idx on public.fact_sources (entity, entity_id);
create index fact_sources_added_by_idx on public.fact_sources (added_by);

create table public.open_checks (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  result public.open_check_result not null,
  note text check (char_length(note) <= 500),
  checked_at timestamptz not null default now()
);
create index open_checks_opportunity_idx on public.open_checks (opportunity_id, checked_at desc);
create index open_checks_user_idx on public.open_checks (user_id);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  type public.submission_type not null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  payload jsonb not null default '{}',
  evidence_url text,
  evidence_note text check (char_length(evidence_note) <= 2000),
  submitted_by uuid not null references auth.users (id) on delete cascade,
  status public.review_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index submissions_status_idx on public.submissions (status, created_at);
create index submissions_submitted_by_idx on public.submissions (submitted_by);
create index submissions_opportunity_idx on public.submissions (opportunity_id);
create index submissions_company_idx on public.submissions (company_id);
create index submissions_reviewed_by_idx on public.submissions (reviewed_by);

-- ---------- private, per user ----------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  full_name text,
  school text,
  campus text,
  program text,
  year_level text,
  required_hours int check (required_hours > 0),
  max_hours int check (max_hours > 0),
  available_from date,
  expected_graduation date,
  preferred_cities text[] not null default '{}',
  min_allowance_per_day numeric(12,2) check (min_allowance_per_day >= 0),
  location_base text,
  willing_to_relocate boolean,
  email text,
  phone text,
  skills text[] not null default '{}',
  projects text,
  portfolio_url text,
  linkedin_url text,
  github_url text,
  fic_name text,
  updated_at timestamptz not null default now(),
  check (required_hours is null or max_hours is null or required_hours <= max_hours)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  company_name_manual text,
  role_manual text,
  status public.application_status not null default 'saved',
  applied_on date,
  channel text,
  follow_up_on date,
  interview_at timestamptz,
  interview_link text,
  confirmed_allowance text,
  confirmed_schedule text,
  notes text,
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (opportunity_id is not null or company_name_manual is not null)
);
create index applications_user_idx on public.applications (user_id, status);
create index applications_opportunity_idx on public.applications (opportunity_id);

-- checklist items live in data, not code
create table public.checklist_templates (
  item_key text primary key check (item_key ~ '^[a-z0-9_]+$'),
  label text not null,
  detail text,
  can_do_without_company boolean not null,
  sort_order int not null
);

create table public.deployment_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_key text not null references public.checklist_templates (item_key) on delete cascade,
  status public.checklist_status not null default 'todo',
  done_on date,
  notes text,
  unique (user_id, item_key)
);
create index deployment_checklist_item_idx on public.deployment_checklist (item_key);

-- ---------- triggers ----------
create trigger companies_updated_at before update on public.companies for each row execute function private.set_updated_at();
create trigger opportunities_updated_at before update on public.opportunities for each row execute function private.set_updated_at();
create trigger partnerships_updated_at before update on public.partnerships for each row execute function private.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger applications_updated_at before update on public.applications for each row execute function private.set_updated_at();
create trigger app_config_updated_at before update on public.app_config for each row execute function private.set_updated_at();

-- new sign-ups get an empty profile and their own checklist copy
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email)
  on conflict (user_id) do nothing;

  insert into public.deployment_checklist (user_id, item_key)
  select new.id, t.item_key from public.checklist_templates t
  on conflict (user_id, item_key) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();
