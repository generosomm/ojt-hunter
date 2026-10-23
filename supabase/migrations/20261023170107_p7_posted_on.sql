-- P7: when the company posted the role (from the job board), so people can filter by "posted within".
-- Null when the board doesn't say (company pages, recurring programs).
alter table public.opportunities add column posted_on date check (posted_on <= current_date + 1);
grant select (posted_on) on public.opportunities to anon, authenticated;
create index opportunities_posted_on_idx on public.opportunities (posted_on desc nulls last);

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
  o.link_status, o.link_checked_at, o.posted_on
from public.opportunities o
join public.companies c on c.id = o.company_id
cross join public.app_config cfg
left join public.partnerships p on p.company_id = o.company_id and p.campus = cfg.campus;
revoke all on public.opportunity_listing from anon, authenticated;
grant select on public.opportunity_listing to anon, authenticated;
