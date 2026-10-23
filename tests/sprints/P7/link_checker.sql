-- P7 link checker and job boards. Runs in one transaction and rolls back.
-- Pass = the final select returns 'ALL PASS'; any failure raises.
begin;

-- verdicts, no network needed
do $$
begin
  if private.link_verdict(404, '') <> 'dead' then raise exception 'FAIL: 404 should be dead'; end if;
  if private.link_verdict(410, null) <> 'dead' then raise exception 'FAIL: 410 should be dead'; end if;
  if private.link_verdict(200, '<p>No longer accepting applications</p>') <> 'dead' then raise exception 'FAIL: closed text should be dead'; end if;
  if private.link_verdict(200, '<h1>IT Intern</h1>') <> 'ok' then raise exception 'FAIL: live page should be ok'; end if;
  if private.link_verdict(301, '') <> 'ok' then raise exception 'FAIL: redirect should be ok'; end if;
  if private.link_verdict(403, '') <> 'blocked' then raise exception 'FAIL: 403 should be blocked, not dead'; end if;
  if private.link_verdict(999, '') <> 'blocked' then raise exception 'FAIL: LinkedIn 999 should be blocked'; end if;
  if private.link_verdict(null, null) <> 'blocked' then raise exception 'FAIL: timeout should be blocked'; end if;
end $$;

-- the public can read boards and link status, but can't call the checker or write boards
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from public.job_boards;
  if n = 0 then raise exception 'FAIL: anon cannot read job boards'; end if;
  perform link_status, link_checked_at from public.opportunity_listing limit 1;
  begin
    perform private.start_link_checks();
    raise exception 'FAIL: anon ran the link checker';
  exception when insufficient_privilege then null;
    when others then if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    insert into public.job_boards (name, search_url) values ('Evil', 'https://evil.test/?q={q}');
    raise exception 'FAIL: anon added a job board';
  exception when insufficient_privilege then null;
    when others then if sqlerrm like 'FAIL%' then raise; end if;
  end;
end $$;
reset role;

-- a signed-in non-admin can't add boards either (RLS)
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000c1', 'p7-student@test.local');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
do $$
begin
  insert into public.job_boards (name, search_url) values ('Evil', 'https://evil.test/?q={q}');
  raise exception 'FAIL: student added a job board';
exception when insufficient_privilege then null;
  when others then if sqlerrm like 'FAIL%' then raise; end if;
end $$;
reset role;

-- a board link must be https and carry {q}
do $$
begin
  insert into public.job_boards (name, search_url) values ('Bad', 'http://x.test/jobs');
  raise exception 'FAIL: bad board url accepted';
exception when check_violation then null;
  when others then if sqlerrm like 'FAIL%' then raise; end if;
end $$;

-- collect: a dead answer marks the role and opens one review item, a second dead answer doesn't duplicate it
do $$
declare
  opp uuid;
  items int;
begin
  select id into opp from public.opportunities where is_published limit 1;
  delete from public.submissions where opportunity_id = opp and type = 'post_closed';
  insert into net._http_response (id, status_code, content, created) values (-901, 404, 'gone', now()), (-902, 404, 'gone', now());
  insert into private.link_check_requests (request_id, opportunity_id) values (-901, opp);
  perform private.collect_link_checks();
  insert into private.link_check_requests (request_id, opportunity_id) values (-902, opp);
  perform private.collect_link_checks();
  if (select link_status from public.opportunities where id = opp) <> 'dead' then raise exception 'FAIL: role not marked dead'; end if;
  select count(*) into items from public.submissions where opportunity_id = opp and type = 'post_closed' and status = 'pending';
  if items <> 1 then raise exception 'FAIL: expected 1 review item, got %', items; end if;
end $$;

-- a blocked answer keeps a dead link dead
do $$
declare opp uuid;
begin
  select id into opp from public.opportunities where is_published and link_status = 'dead' limit 1;
  insert into net._http_response (id, status_code, content, created) values (-903, 403, '', now());
  insert into private.link_check_requests (request_id, opportunity_id) values (-903, opp);
  perform private.collect_link_checks();
  if (select link_status from public.opportunities where id = opp) <> 'dead' then raise exception 'FAIL: blocked overwrote dead'; end if;
end $$;

-- the admin rejects the checker's item: Apply comes back and the next dead answer doesn't hide it again
do $$
declare
  opp uuid;
  item uuid;
  admin_id uuid;
begin
  select id into opp from public.opportunities where is_published and link_status = 'dead' limit 1;
  select id into item from public.submissions where opportunity_id = opp and type = 'post_closed' and status = 'pending';
  select user_id into admin_id from public.admins order by created_at limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.review_submission(item, false);
  reset role;
  if (select link_status from public.opportunities where id = opp) = 'dead' then raise exception 'FAIL: reject left the link dead'; end if;
  insert into net._http_response (id, status_code, content, created) values (-904, 404, '', now());
  insert into private.link_check_requests (request_id, opportunity_id) values (-904, opp);
  perform private.collect_link_checks();
  if (select link_status from public.opportunities where id = opp) = 'dead' then raise exception 'FAIL: checker overruled the admin'; end if;
  if exists (select 1 from public.submissions where opportunity_id = opp and type = 'post_closed' and status = 'pending') then
    raise exception 'FAIL: checker reopened a rejected item';
  end if;
end $$;

select 'ALL PASS';
rollback;
