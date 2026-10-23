-- After the admin reviews a "post closed" item, only reports made since then count toward the next one,
-- so a rejected false alarm doesn't come straight back from the old reports.
create or replace function private.after_open_check()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  reports int;
  cfg public.app_config;
  since timestamptz;
begin
  select * into cfg from public.app_config;
  if new.result = 'opened_and_open' then
    update public.opportunities set last_checked_at = now(), last_checked_by = new.user_id where id = new.opportunity_id;
  elsif new.result in ('link_dead', 'opened_but_closed') then
    select max(s.reviewed_at) into since from public.submissions s
    where s.opportunity_id = new.opportunity_id and s.type = 'post_closed' and s.status <> 'pending';
    select count(distinct user_id) into reports from public.open_checks
    where opportunity_id = new.opportunity_id
      and result in ('link_dead', 'opened_but_closed')
      and checked_at > greatest(now() - make_interval(days => cfg.stale_after_days), coalesce(since, '-infinity'));
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
