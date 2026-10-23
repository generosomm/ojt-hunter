-- P7: the admin has the last word on a link, and "blocked" never erases what we already know.
-- 1. Rejecting a "post closed" item puts the Apply button back (link_status unknown), and the checker
--    doesn't mark that role dead again until the stale window passes.
-- 2. A blocked answer (403, 429, timeout) keeps the previous verdict instead of overwriting a dead one.

create or replace function public.review_submission(sub_id uuid, approve boolean)
returns text language plpgsql set search_path = '' as $$
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
  elsif s.type = 'post_closed' then
    -- the admin says the post is still up: show the Apply button again
    update public.opportunities set link_status = 'unknown' where id = s.opportunity_id and link_status = 'dead';
  end if;

  update public.submissions
  set status = case when approve then 'approved' else 'rejected' end::public.review_status,
      reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = sub_id;
  return case when approve then 'approved' else 'rejected' end;
end $$;

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
    select q.request_id, q.opportunity_id, resp.status_code, resp.content, o.link_status as previous
    from private.link_check_requests q
    join net._http_response resp on resp.id = q.request_id
    join public.opportunities o on o.id = q.opportunity_id
  loop
    verdict := private.link_verdict(r.status_code, r.content);
    -- blocked tells us nothing new, so a dead link stays dead
    if verdict = 'blocked' and r.previous = 'dead' then
      verdict := 'dead';
    end if;
    -- the admin rejected a "post closed" item recently: trust the admin over the checker
    if verdict = 'dead' and exists (
      select 1 from public.submissions s
      where s.opportunity_id = r.opportunity_id and s.type = 'post_closed' and s.status = 'rejected'
        and s.reviewed_at > now() - make_interval(days => cfg.stale_after_days)
    ) then
      verdict := 'unknown';
    end if;
    update public.opportunities set link_status = verdict, link_checked_at = now() where id = r.opportunity_id;
    -- one open item at a time, and an item the admin already reviewed stays quiet until the stale window passes
    if verdict = 'dead' and owner is not null and not exists (
      select 1 from public.submissions s
      where s.opportunity_id = r.opportunity_id and s.type = 'post_closed'
        and (s.status = 'pending' or s.reviewed_at > now() - make_interval(days => cfg.stale_after_days))
    ) then
      insert into public.submissions (type, opportunity_id, payload, evidence_note, submitted_by)
      values ('post_closed', r.opportunity_id, jsonb_build_object('source', 'link_checker', 'http_status', r.status_code),
              case when r.status_code in (404, 410)
                then format('Nightly link check: the apply link returned %s (page gone).', r.status_code)
                else 'Nightly link check: the apply page says the post is closed.' end, owner);
    end if;
    delete from private.link_check_requests where request_id = r.request_id;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function private.collect_link_checks() from public, anon, authenticated;
