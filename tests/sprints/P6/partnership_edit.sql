-- P6 test: admin partnership/MOA edits work with column-level grants (update by id or insert; an upsert would fail 42501).
begin;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'c@example.test', '{}', now(), now());
insert into public.admins (user_id) values ('cccccccc-0000-0000-0000-00000000000c');
insert into public.companies (id, slug, name) values ('c0000000-0000-0000-0000-0000000000aa', 'zz-new-co', 'ZZ New Co');
create temp table t_co as select id from public.companies where slug = 'kpmg';
grant select on t_co to authenticated;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ declare n int; begin
  update public.partnerships set status = 'confirmed_by_school' where company_id = (select id from t_co);
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: non-admin changed a partnership'; end if;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}';
update public.partnerships set status = 'moa_requested', notes = 'test note', source = 'Admin update', source_date = current_date, updated_by = 'cccccccc-0000-0000-0000-00000000000c'
where id = (select p.id from public.partnerships p where p.company_id = (select id from t_co) and p.campus = 'NU Laguna');
insert into public.partnerships (company_id, campus, status, notes, source, source_date, updated_by)
values ('c0000000-0000-0000-0000-0000000000aa', 'NU Laguna', 'needs_clarification', 'new', 'Admin update', current_date, 'cccccccc-0000-0000-0000-00000000000c');
update public.moa_requests set status = 'in_progress', notes = 'x', last_update = current_date where company_id = (select id from t_co);
insert into public.moa_requests (company_id, campus, status, notes, requested_on, last_update, created_by)
values ('c0000000-0000-0000-0000-0000000000aa', 'NU Laguna', 'requested', 'n', current_date, current_date, 'cccccccc-0000-0000-0000-00000000000c');
reset role;
do $$ begin
  if (select notes from public.partnerships where company_id = (select id from t_co)) <> 'test note' then raise exception 'FAIL: update did not save'; end if;
  if (select count(*) from public.partnerships where company_id = 'c0000000-0000-0000-0000-0000000000aa') <> 1 then raise exception 'FAIL: insert did not save'; end if;
  if (select status from public.moa_requests where company_id = (select id from t_co)) <> 'in_progress' then raise exception 'FAIL: MOA update'; end if;
end $$;
select 'PARTNERSHIP EDIT CHECKS PASSED' r;
rollback;
