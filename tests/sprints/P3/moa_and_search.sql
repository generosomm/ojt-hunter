-- P3 access test: MOA support rows are private, counts are public, checker search works for anon.
-- Run as postgres (SQL Editor or MCP execute_sql). Rolled back; any failure raises FAIL.
begin;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'test-a@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'test-b@example.test', '{}', now(), now());
create temp table t_req as select id from public.moa_requests limit 1;
grant select on t_req to authenticated, anon;
insert into public.moa_request_supporters select id, 'bbbbbbbb-0000-0000-0000-00000000000b' from t_req;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ declare n int; begin
  insert into public.moa_request_supporters (moa_request_id, user_id) select id, 'aaaaaaaa-0000-0000-0000-00000000000a' from t_req;
  if (select count(*) from public.moa_request_supporters) <> 1 then raise exception 'FAIL: user sees other supporters'; end if;
  if (select supporters from public.moa_supporter_counts()) <> 2 then raise exception 'FAIL: count should be 2'; end if;
  begin
    insert into public.moa_request_supporters (moa_request_id, user_id) select id, 'bbbbbbbb-0000-0000-0000-00000000000b' from t_req;
    raise exception 'FAIL: added someone else';
  exception when insufficient_privilege or unique_violation then null; end;
  delete from public.moa_request_supporters where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: removed someone else'; end if;
  delete from public.moa_request_supporters where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a';
  if (select supporters from public.moa_supporter_counts()) <> 1 then raise exception 'FAIL: own remove did not work'; end if;
end $$;
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  begin perform 1 from public.moa_request_supporters; raise exception 'FAIL: anon reads supporters';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.resources) < 1 then raise exception 'FAIL: resources not public'; end if;
  if (select count(*) from public.search_hte('kmc')) < 1 then raise exception 'FAIL: anon search'; end if;
end $$;
select 'ALL P3 CHECKS PASSED' result;
rollback;
