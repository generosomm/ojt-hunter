-- P7: the review note says which signal the checker saw (page gone, or "closed" text on the page).

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

update public.submissions set evidence_note = 'Nightly link check: the apply page says the post is closed.'
where type = 'post_closed' and status = 'pending' and payload->>'source' = 'link_checker' and payload->>'http_status' = '200';
