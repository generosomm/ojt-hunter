-- P7: job board search links, and a nightly check of every apply link.
-- The check runs inside the database (pg_net + pg_cron), so the app needs no secret key.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------- 1. job boards: "find it on" search links, editable as data ----------
create table public.job_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  -- {q} is replaced with the encoded search words, e.g. "Sun Life intern"
  search_url text not null check (search_url ~ '^https://' and position('{q}' in search_url) > 0),
  sort_order int not null default 0,
  is_active boolean not null default true
);
alter table public.job_boards enable row level security;
revoke all on public.job_boards from anon, authenticated;
grant select on public.job_boards to anon, authenticated;
grant insert, update, delete on public.job_boards to authenticated;
grant all on public.job_boards to service_role;
create policy "read job boards" on public.job_boards for select using (is_active or (select private.is_admin()));
create policy "admin inserts job boards" on public.job_boards for insert to authenticated with check ((select private.is_admin()));
create policy "admin updates job boards" on public.job_boards for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin deletes job boards" on public.job_boards for delete to authenticated using ((select private.is_admin()));

-- ---------- 2. what the last check found ----------
-- blocked = the site refuses automated checks (LinkedIn, JobStreet) or timed out: we can't tell, so the link stays
create type public.link_status as enum ('unknown', 'ok', 'dead', 'blocked');
alter table public.opportunities
  add column link_status public.link_status not null default 'unknown',
  add column link_checked_at timestamptz;
grant select (link_status, link_checked_at) on public.opportunities to anon, authenticated;

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
  (o.last_checked_at is null or o.last_checked_at < now() - make_interval(days => cfg.stale_after_days)) as needs_recheck,
  o.link_status, o.link_checked_at
from public.opportunities o
join public.companies c on c.id = o.company_id
cross join public.app_config cfg
left join public.partnerships p on p.company_id = o.company_id and p.campus = cfg.campus;
revoke all on public.opportunity_listing from anon, authenticated;
grant select on public.opportunity_listing to anon, authenticated;

-- ---------- 3. the nightly check ----------
create table private.link_check_requests (
  request_id bigint primary key,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  requested_at timestamptz not null default now()
);

-- step 1: send one GET per live apply link (pg_net answers later, in net._http_response)
create or replace function private.start_link_checks()
returns int language plpgsql security definer set search_path = '' as $$
declare
  r record;
  n int := 0;
begin
  delete from private.link_check_requests where requested_at < now() - interval '1 day';
  for r in
    select id, apply_url from public.opportunities
    where is_published and apply_url ~ '^https://' and post_status <> 'closed'
  loop
    insert into private.link_check_requests (request_id, opportunity_id)
    values (
      net.http_get(
        url := r.apply_url,
        headers := jsonb_build_object('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'),
        timeout_milliseconds := 20000
      ),
      r.id
    );
    n := n + 1;
  end loop;
  return n;
end $$;

-- the verdict alone, so tests can check it without the network
create or replace function private.link_verdict(status_code int, content text)
returns public.link_status language sql immutable set search_path = '' as $$
  select case
    when status_code in (404, 410) then 'dead'
    when status_code between 200 and 399
      and content ~* '(no longer accepting applications|this job is no longer (available|open)|job (has )?expired|position has been filled|job (posting )?not found)'
      then 'dead'
    when status_code between 200 and 399 then 'ok'
    else 'blocked'
  end::public.link_status
$$;

-- step 2: read the answers, save the verdict, and send newly dead links to the review queue
create or replace function private.collect_link_checks()
returns int language plpgsql security definer set search_path = '' as $$
declare
  r record;
  verdict public.link_status;
  owner uuid;
  cfg public.app_config;
  n int := 0;
begin
  select * into cfg from public.app_config;
  -- the queue needs a submitter; the first admin stands in for the checker
  select user_id into owner from public.admins order by created_at limit 1;
  for r in
    select q.request_id, q.opportunity_id, resp.status_code, resp.content
    from private.link_check_requests q
    join net._http_response resp on resp.id = q.request_id
  loop
    verdict := private.link_verdict(r.status_code, r.content);
    update public.opportunities set link_status = verdict, link_checked_at = now() where id = r.opportunity_id;
    -- one open item at a time, and an item the admin already reviewed stays quiet until the stale window passes
    if verdict = 'dead' and owner is not null and not exists (
      select 1 from public.submissions s
      where s.opportunity_id = r.opportunity_id and s.type = 'post_closed'
        and (s.status = 'pending' or s.reviewed_at > now() - make_interval(days => cfg.stale_after_days))
    ) then
      insert into public.submissions (type, opportunity_id, payload, evidence_note, submitted_by)
      values ('post_closed', r.opportunity_id, jsonb_build_object('source', 'link_checker', 'http_status', r.status_code),
              format('Nightly link check: the apply link returned %s or says the post is closed.', coalesce(r.status_code::text, 'no answer')), owner);
    end if;
    delete from private.link_check_requests where request_id = r.request_id;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function private.start_link_checks() from public, anon, authenticated;
revoke all on function private.collect_link_checks() from public, anon, authenticated;
revoke all on function private.link_verdict(int, text) from public, anon, authenticated;

-- 02:00 and 02:15 Manila time (18:00 and 18:15 UTC)
select cron.schedule('link-check-start', '0 18 * * *', 'select private.start_link_checks()');
select cron.schedule('link-check-collect', '15 18 * * *', 'select private.collect_link_checks()');
