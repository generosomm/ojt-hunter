-- P6 test: user ids hidden, still-open rules, admin-only review that applies changes atomically.
-- Run as postgres (SQL Editor or MCP execute_sql). Rolled back; any failure raises FAIL.
begin;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'test-a@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'test-b@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'test-c@example.test', '{}', now(), now());
insert into public.admins (user_id) values ('cccccccc-0000-0000-0000-00000000000c');
insert into public.companies (id, slug, name, is_published) values ('c0000000-0000-0000-0000-000000000001', 'zz-test-co', 'ZZ Test Co', true);
insert into public.opportunities (id, slug, company_id, title, is_published, post_status, last_checked_at) values
  ('d0000000-0000-0000-0000-000000000001', 'zz-test-role', 'c0000000-0000-0000-0000-000000000001', 'ZZ Role', true, 'open', '2000-01-01');

-- anon: no user ids anywhere
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  begin perform created_by from public.opportunities limit 1; raise exception 'FAIL: anon reads opportunities.created_by';
  exception when insufficient_privilege then null; end;
  begin perform created_by from public.moa_requests limit 1; raise exception 'FAIL: anon reads moa_requests.created_by';
  exception when insufficient_privilege then null; end;
  begin perform added_by from public.fact_sources limit 1; raise exception 'FAIL: anon reads fact_sources.added_by';
  exception when insufficient_privilege then null; end;
  if exists (select 1 from information_schema.columns where table_name = 'opportunity_listing' and column_name in ('created_by', 'last_checked_by'))
    then raise exception 'FAIL: listing view exposes user ids'; end if;
  if (select count(*) from public.opportunity_listing where slug = 'zz-test-role') <> 1 then raise exception 'FAIL: listing view broken'; end if;
end $$;
reset role;

-- user A: "open" refreshes the date; a second check the same day is refused
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ begin
  insert into public.open_checks (opportunity_id, user_id, result) values ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-00000000000a', 'opened_and_open');
  begin
    insert into public.open_checks (opportunity_id, user_id, result) values ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-00000000000a', 'link_dead');
    raise exception 'FAIL: two checks in one day';
  exception when unique_violation then null; end;
  begin perform public.review_submission(gen_random_uuid(), true); raise exception 'FAIL: non-admin reviewed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if (select last_checked_at from public.opportunities where slug = 'zz-test-role') < now() - interval '1 minute'
    then raise exception 'FAIL: open check did not refresh last_checked_at'; end if;
end $$;

-- two different people report it closed: one pending queue item, post still open
update public.open_checks set checked_at = checked_at - interval '1 day' where opportunity_id = 'd0000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into public.open_checks (opportunity_id, user_id, result) values ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-00000000000a', 'link_dead');
reset role;
do $$ begin
  if exists (select 1 from public.submissions where opportunity_id = 'd0000000-0000-0000-0000-000000000001') then raise exception 'FAIL: one report flagged it'; end if;
end $$;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}';
insert into public.open_checks (opportunity_id, user_id, result) values ('d0000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-00000000000b', 'opened_but_closed');
-- user B also submits a new role
insert into public.submissions (type, payload, evidence_url, submitted_by)
values ('new_opportunity', '{"company":"ZZ Brand New Inc.","title":"QA Intern","setup":"hybrid","city":"Makati"}', 'https://example.test/post', 'bbbbbbbb-0000-0000-0000-00000000000b');
reset role;
do $$ begin
  if (select count(*) from public.submissions where opportunity_id = 'd0000000-0000-0000-0000-000000000001' and type = 'post_closed' and status = 'pending') <> 1
    then raise exception 'FAIL: two reports did not create exactly one queue item'; end if;
  if (select post_status from public.opportunities where slug = 'zz-test-role') <> 'open' then raise exception 'FAIL: post auto-closed'; end if;
end $$;

-- admin approves both
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}';
do $$ declare sid uuid; begin
  select id into sid from public.submissions where opportunity_id = 'd0000000-0000-0000-0000-000000000001' and type = 'post_closed';
  perform public.review_submission(sid, true);
  if (select post_status from public.opportunities where slug = 'zz-test-role') <> 'closed' then raise exception 'FAIL: approve did not close the post'; end if;
  begin perform public.review_submission(sid, false); raise exception 'FAIL: reviewed twice';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;

  select id into sid from public.submissions where type = 'new_opportunity' and payload ->> 'company' = 'ZZ Brand New Inc.';
  perform public.review_submission(sid, true);
  if (select count(*) from public.opportunities o join public.companies c on c.id = o.company_id
      where c.name = 'ZZ Brand New Inc.' and o.title = 'QA Intern' and not o.is_published and o.setup = 'hybrid') <> 1
    then raise exception 'FAIL: new role not created as a draft'; end if;
end $$;
reset role;
select 'ALL P6 CHECKS PASSED' result;
rollback;
