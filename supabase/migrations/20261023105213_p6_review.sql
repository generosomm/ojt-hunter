-- P6: hide user ids from the public API, "still open?" checks, admin review in one transaction.

-- ---------- 1. user ids never readable through the Data API ----------
-- the listing view names its columns, so it can't pull created_by / last_checked_by
drop view public.opportunity_listing;
create view public.opportunity_listing with (security_invoker = on) as
select
  o.id, o.slug, o.company_id, o.title, o.role_category, o.duties, o.tech_stack, o.dev_exposure, o.city, o.office_address,
  o.setup, o.onsite_days_per_week, o.employment_type, o.moa_requirement, o.schedule_text,
  o.allowance_amount, o.allowance_min, o.allowance_max, o.allowance_basis, o.allowance_status, o.allowance_source, o.allowance_verified,
  o.required_hours_min, o.required_hours_max, o.duration_text, o.intake_text, o.earliest_start, o.deadline, o.accepts_nov_start,
  o.school_requirements, o.apply_url, o.apply_channel, o.apply_instructions, o.post_status, o.last_checked_at, o.source_url, o.notes,
  o.is_published, o.created_at, o.updated_at,
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

-- column-level reads: every column except the ones that point at a person
do $$
declare
  t record;
  cols text;
begin
  for t in select * from (values
    ('opportunities', array['created_by', 'last_checked_by']),
    ('moa_requests', array['created_by']),
    ('partnerships', array['updated_by']),
    ('fact_sources', array['added_by'])
  ) as v(tbl, hidden)
  loop
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = t.tbl and column_name <> all (t.hidden);
    execute format('revoke select on public.%I from anon, authenticated', t.tbl);
    execute format('grant select (%s) on public.%I to anon, authenticated', cols, t.tbl);
  end loop;
end $$;

-- ---------- 2. "still open?" checks ----------
alter table public.app_config add column closed_report_threshold int not null default 2 check (closed_report_threshold >= 1);

-- one check per person per role per day (Manila date)
create unique index open_checks_daily_uniq on public.open_checks (opportunity_id, user_id, ((timezone('Asia/Manila', checked_at))::date));

-- "open" refreshes the checked date; enough "closed/dead" reports from different people go to the admin queue.
-- Never closes a post by itself.
create or replace function private.after_open_check()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  reports int;
  cfg public.app_config;
begin
  select * into cfg from public.app_config;
  if new.result = 'opened_and_open' then
    update public.opportunities set last_checked_at = now(), last_checked_by = new.user_id where id = new.opportunity_id;
  elsif new.result in ('link_dead', 'opened_but_closed') then
    select count(distinct user_id) into reports from public.open_checks
    where opportunity_id = new.opportunity_id
      and result in ('link_dead', 'opened_but_closed')
      and checked_at > now() - make_interval(days => cfg.stale_after_days);
    if reports >= cfg.closed_report_threshold and not exists (
      select 1 from public.submissions s where s.opportunity_id = new.opportunity_id and s.type = 'post_closed' and s.status = 'pending'
    ) then
      insert into public.submissions (type, opportunity_id, payload, evidence_note, submitted_by)
      values ('post_closed', new.opportunity_id, jsonb_build_object('source', 'still_open_checks', 'reports', reports),
              format('%s classmates reported this post as closed or the link as dead.', reports), new.user_id);
    end if;
  end if;
  return new;
end $$;
revoke all on function private.after_open_check() from public, anon, authenticated;
create trigger open_checks_after_insert after insert on public.open_checks
for each row execute function private.after_open_check();

-- ---------- 3. admin review: apply + mark reviewed in one transaction ----------
create or replace function private.slugify(raw text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(btrim(regexp_replace(lower(raw), '[^a-z0-9]+', '-', 'g'), '-'), ''), 'item')
$$;

create or replace function public.review_submission(sub_id uuid, approve boolean)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  s public.submissions;
  company uuid;
  base text;
  candidate text;
  n int := 1;
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can review submissions.' using errcode = '42501';
  end if;
  select * into s from public.submissions where id = sub_id for update;
  if not found then raise exception 'Submission not found.'; end if;
  if s.status <> 'pending' then raise exception 'This submission was already reviewed.'; end if;

  if approve then
    case s.type
      when 'post_closed' then
        update public.opportunities set post_status = 'closed', last_checked_at = now() where id = s.opportunity_id;
      when 'email_bounced' then
        update public.company_contacts set status = 'bounced', observed_on = current_date
        where company_id = s.company_id and lower(email) = lower(s.payload ->> 'email');
      when 'new_opportunity' then
        select c.id into company from public.companies c
        where public.normalize_company_name(c.name) = public.normalize_company_name(s.payload ->> 'company')
           or public.normalize_company_name(c.legal_name) = public.normalize_company_name(s.payload ->> 'company')
        limit 1;
        if company is null then
          base := private.slugify(s.payload ->> 'company');
          candidate := base;
          while exists (select 1 from public.companies where slug = candidate) loop
            n := n + 1; candidate := base || '-' || n;
          end loop;
          insert into public.companies (slug, name) values (candidate, s.payload ->> 'company') returning id into company;
          insert into public.partnerships (company_id, campus, status, source, notes)
          select company, cfg.campus, 'needs_clarification', 'Added from a classmate submission', 'Not checked against the HTE list yet.'
          from public.app_config cfg;
        end if;
        base := private.slugify((s.payload ->> 'company') || ' ' || (s.payload ->> 'title'));
        candidate := base; n := 1;
        while exists (select 1 from public.opportunities where slug = candidate) loop
          n := n + 1; candidate := base || '-' || n;
        end loop;
        -- lands as a draft: the admin reviews it and publishes from the role page
        insert into public.opportunities (slug, company_id, title, apply_url, city, setup, allowance_source, notes, source_url, last_checked_at, created_by)
        values (candidate, company, s.payload ->> 'title', nullif(s.payload ->> 'apply_url', ''), nullif(s.payload ->> 'city', ''),
                coalesce(nullif(s.payload ->> 'setup', ''), 'unknown')::public.work_setup, nullif(s.payload ->> 'allowance', ''),
                nullif(s.payload ->> 'notes', ''), s.evidence_url, now(), s.submitted_by);
      else
        null; -- allowance, hours, MOA and corrections: recorded as evidence below, admin edits the role
    end case;

    if s.type <> 'new_opportunity' and coalesce(s.payload ->> 'value', s.evidence_note) is not null then
      insert into public.fact_sources (entity, entity_id, field, value, source_url, source_type, state, observed_on, added_by)
      values (case when s.opportunity_id is not null then 'opportunity' else 'company' end::public.fact_entity,
              coalesce(s.opportunity_id, s.company_id), s.type::text, coalesce(s.payload ->> 'value', s.evidence_note),
              s.evidence_url, 'classmate_report', 'reported', current_date, s.submitted_by);
    end if;
  end if;

  update public.submissions
  set status = case when approve then 'approved' else 'rejected' end::public.review_status,
      reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = sub_id;
  return case when approve then 'approved' else 'rejected' end;
end $$;
revoke all on function public.review_submission(uuid, boolean) from public, anon;
grant execute on function public.review_submission(uuid, boolean) to authenticated;
grant execute on function private.slugify(text) to authenticated;
