-- OJT Hunter access rules (P1): explicit grants + RLS on every table.
-- Public: published listings and school/reference data. Private: anything about a user.
-- Admins: rows in public.admins, checked here and server side.

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
-- policies call private.is_admin(); the private schema itself is not exposed by the Data API
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

-- lower case, no punctuation, no legal suffixes: "KMC MAG Solutions, Inc." -> "kmc mag solutions"
create or replace function public.normalize_company_name(raw text)
returns text language sql immutable parallel safe set search_path = '' as $$
  select btrim(regexp_replace(regexp_replace(
    regexp_replace(lower(coalesce(raw, '')), '[^a-z0-9]+', ' ', 'g'),
    '\m(inc|corp|corporation|co|company|ltd|limited|opc|llc|philippines|phils|ph|the)\M', ' ', 'g'),
    '\s+', ' ', 'g'))
$$;

-- ---------- grants: start from nothing, then add what each role needs ----------
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;

grant select on public.app_config, public.companies, public.company_contacts, public.hte_list_entries,
  public.partnerships, public.moa_requests, public.opportunities, public.fact_sources,
  public.checklist_templates to anon, authenticated;

-- admin edits (RLS below limits these to admins)
grant insert, update, delete on public.companies, public.company_contacts, public.hte_list_entries,
  public.partnerships, public.moa_requests, public.opportunities, public.fact_sources,
  public.checklist_templates to authenticated;
grant update on public.app_config to authenticated;
grant usage on all sequences in schema public to authenticated;
grant select on public.admins to authenticated;

-- signed-in users
grant select, insert, delete on public.moa_request_supporters to authenticated;
grant select, insert on public.open_checks to authenticated;
grant select, insert on public.submissions to authenticated;
grant update (status, reviewed_by, reviewed_at) on public.submissions to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.deployment_checklist to authenticated;

-- ---------- RLS ----------
alter table public.app_config enable row level security;
alter table public.admins enable row level security;
alter table public.companies enable row level security;
alter table public.company_contacts enable row level security;
alter table public.hte_list_entries enable row level security;
alter table public.partnerships enable row level security;
alter table public.moa_requests enable row level security;
alter table public.moa_request_supporters enable row level security;
alter table public.opportunities enable row level security;
alter table public.fact_sources enable row level security;
alter table public.open_checks enable row level security;
alter table public.submissions enable row level security;
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.deployment_checklist enable row level security;

-- reference data anyone can read
create policy "read config" on public.app_config for select using (true);
create policy "admin edits config" on public.app_config for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "read hte list" on public.hte_list_entries for select
  using ((select hte_list_public from public.app_config) or (select private.is_admin()));
create policy "admin writes hte list" on public.hte_list_entries for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "read checklist templates" on public.checklist_templates for select using (true);
create policy "admin writes checklist templates" on public.checklist_templates for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "see own admin row" on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- listings: public only once published
create policy "read published companies" on public.companies for select
  using (is_published or (select private.is_admin()));
create policy "admin writes companies" on public.companies for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "read contacts of published companies" on public.company_contacts for select
  using ((select private.is_admin()) or exists (
    select 1 from public.companies c where c.id = company_id and c.is_published));
create policy "admin writes contacts" on public.company_contacts for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "read partnerships of published companies" on public.partnerships for select
  using ((select private.is_admin()) or exists (
    select 1 from public.companies c where c.id = company_id and c.is_published));
create policy "admin writes partnerships" on public.partnerships for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "read moa requests of published companies" on public.moa_requests for select
  using ((select private.is_admin()) or exists (
    select 1 from public.companies c where c.id = company_id and c.is_published));
create policy "admin writes moa requests" on public.moa_requests for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "read published opportunities" on public.opportunities for select
  using (is_published or (select private.is_admin()));
create policy "admin writes opportunities" on public.opportunities for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "read facts of published items" on public.fact_sources for select
  using ((select private.is_admin())
    or (entity = 'company' and exists (select 1 from public.companies c where c.id = entity_id and c.is_published))
    or (entity = 'opportunity' and exists (select 1 from public.opportunities o where o.id = entity_id and o.is_published))
    or (entity = 'partnership' and exists (
      select 1 from public.partnerships p join public.companies c on c.id = p.company_id
      where p.id = entity_id and c.is_published)));
create policy "admin writes facts" on public.fact_sources for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- "I also need this MOA": you only see and change your own rows; counts come from moa_supporter_counts()
create policy "own moa support" on public.moa_request_supporters for select to authenticated
  using (user_id = (select auth.uid()));
create policy "add own moa support" on public.moa_request_supporters for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "remove own moa support" on public.moa_request_supporters for delete to authenticated
  using (user_id = (select auth.uid()));

-- "Still open?" checks: write your own, read your own (public history comes from open_check_history())
create policy "own open checks" on public.open_checks for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "add own open check" on public.open_checks for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.opportunities o where o.id = opportunity_id and o.is_published));

-- submissions: anyone signed in can submit; only admins review
create policy "own or admin submissions" on public.submissions for select to authenticated
  using (submitted_by = (select auth.uid()) or (select private.is_admin()));
create policy "submit as yourself" on public.submissions for insert to authenticated
  with check (submitted_by = (select auth.uid()) and status = 'pending'
    and reviewed_by is null and reviewed_at is null);
create policy "admin reviews submissions" on public.submissions for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- private per-user data: owner only, admins included in "nobody else"
create policy "own profile" on public.profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own applications" on public.applications for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own checklist" on public.deployment_checklist for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- read helpers ----------
-- listing view: per-day estimates use app_config, so changing 22 days or 8 hours needs no code change
create view public.opportunity_listing with (security_invoker = on) as
select
  o.*,
  c.name as company_name,
  c.slug as company_slug,
  p.status as partnership_status,
  p.matched_name_as_listed,
  round(case o.allowance_basis
    when 'per_day' then coalesce(o.allowance_min, o.allowance_amount)
    when 'per_month' then coalesce(o.allowance_min, o.allowance_amount) / cfg.working_days_per_month
    when 'per_hour' then coalesce(o.allowance_min, o.allowance_amount) * cfg.hours_per_day
  end, 0) as allowance_per_day_low,
  round(case o.allowance_basis
    when 'per_day' then coalesce(o.allowance_max, o.allowance_amount)
    when 'per_month' then coalesce(o.allowance_max, o.allowance_amount) / cfg.working_days_per_month
    when 'per_hour' then coalesce(o.allowance_max, o.allowance_amount) * cfg.hours_per_day
  end, 0) as allowance_per_day_high,
  (o.last_checked_at is null or o.last_checked_at < now() - make_interval(days => cfg.stale_after_days)) as needs_recheck
from public.opportunities o
join public.companies c on c.id = o.company_id
cross join public.app_config cfg
left join public.partnerships p on p.company_id = o.company_id and p.campus = cfg.campus;

revoke all on public.opportunity_listing from anon, authenticated;
grant select on public.opportunity_listing to anon, authenticated;

create or replace function public.moa_supporter_counts()
returns table (moa_request_id uuid, supporters bigint)
language sql stable security definer set search_path = '' as $$
  select s.moa_request_id, count(*) from public.moa_request_supporters s group by s.moa_request_id;
$$;
revoke all on function public.moa_supporter_counts() from public, anon, authenticated;
grant execute on function public.moa_supporter_counts() to anon, authenticated;

-- results and dates only, never who checked or their note
create or replace function public.open_check_history(opp uuid)
returns table (result public.open_check_result, checked_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select oc.result, oc.checked_at
  from public.open_checks oc
  join public.opportunities o on o.id = oc.opportunity_id
  where oc.opportunity_id = opp and o.is_published
  order by oc.checked_at desc
  limit 20;
$$;
revoke all on function public.open_check_history(uuid) from public, anon, authenticated;
grant execute on function public.open_check_history(uuid) to anon, authenticated;
