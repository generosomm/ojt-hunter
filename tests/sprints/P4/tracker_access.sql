-- P4 access test: tracker, profile and checklist are owner-only; one tracker card per role per user.
-- Run as postgres (SQL Editor or MCP execute_sql). Rolled back; any failure raises FAIL.
begin;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'test-a@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'test-b@example.test', '{}', now(), now());
create temp table t_opp as select id from public.opportunities where is_published limit 1;
grant select on t_opp to authenticated;
insert into public.applications (user_id, company_name_manual) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'B private');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ declare n int; begin
  -- save a role twice: second insert must not create a duplicate
  insert into public.applications (user_id, opportunity_id) select 'aaaaaaaa-0000-0000-0000-00000000000a', id from t_opp;
  insert into public.applications (user_id, opportunity_id) select 'aaaaaaaa-0000-0000-0000-00000000000a', id from t_opp on conflict do nothing;
  if (select count(*) from public.applications) <> 1 then raise exception 'FAIL: duplicate card or sees others'; end if;

  begin
    insert into public.applications (user_id, company_name_manual) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'sneaky');
    raise exception 'FAIL: wrote into another tracker';
  exception when insufficient_privilege then null; end;

  update public.applications set status = 'applied' where company_name_manual = 'B private';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: changed another tracker'; end if;

  update public.profiles set required_hours = 600, max_hours = 800 where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: cannot update own profile'; end if;
  update public.profiles set full_name = 'x' where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: changed another profile'; end if;
  begin
    update public.profiles set required_hours = 900, max_hours = 800 where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a';
    raise exception 'FAIL: max hours below required accepted';
  exception when check_violation then null; end;

  if (select count(*) from public.deployment_checklist) <> (select count(*) from public.checklist_templates) then
    raise exception 'FAIL: checklist not seeded for new user or sees others'; end if;
  update public.deployment_checklist set status = 'done' where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: changed another checklist'; end if;
end $$;
reset role;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  begin perform 1 from public.deployment_checklist; raise exception 'FAIL: anon reads checklists';
  exception when insufficient_privilege then null; end;
end $$;
select 'ALL P4 CHECKS PASSED' result;
rollback;
