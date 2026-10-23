-- P6 test: only admins import HTE lists; blank names skipped; names normalized; checker uses it; versions unique.
begin;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'test-a@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'test-c@example.test', '{}', now(), now());
insert into public.admins (user_id) values ('cccccccc-0000-0000-0000-00000000000c');
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ begin
  begin perform public.admin_import_hte('ZZ TEST', '[{"no":1,"name":"ZZ CO"}]', false); raise exception 'FAIL: non-admin imported';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}';
do $$ declare n int; begin
  n := public.admin_import_hte('ZZ TEST', '[{"no":1,"name":"KMC MAG Solutions, Inc."},{"no":2,"name":"  "},{"no":3,"name":"ZZ Two Corp"}]', true);
  if n <> 2 then raise exception 'FAIL: expected 2 rows, got %', n; end if;
  if (select hte_list_version from public.app_config) <> 'ZZ TEST' then raise exception 'FAIL: not made current'; end if;
  if (select normalized_name from public.hte_list_entries where list_version = 'ZZ TEST' and entry_no = 1) <> 'kmc mag solutions' then raise exception 'FAIL: not normalized'; end if;
  if (select count(*) from public.search_hte('kmc')) < 1 then raise exception 'FAIL: checker does not use the new list'; end if;
  begin perform public.admin_import_hte('ZZ TEST', '[{"no":1,"name":"X"}]', false); raise exception 'FAIL: duplicate version allowed';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
end $$;
reset role;
select 'HTE IMPORT CHECKS PASSED' r;
rollback;
