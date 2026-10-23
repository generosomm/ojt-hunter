-- P1 access-rule test. Run as the postgres role (Supabase SQL editor or MCP execute_sql).
-- Everything runs in one transaction and is rolled back. Any failed check raises an error.
begin;

-- fixtures (the real app_config row may already exist, so update in place)
insert into public.app_config (campus, hte_list_version) values ('TEST CAMPUS', 'TEST')
  on conflict (id) do nothing;
update public.app_config set hte_list_public = false;
insert into public.checklist_templates (item_key, label, can_do_without_company, sort_order) values
  ('zz_test_a', 'Test A', true, 9001), ('zz_test_b', 'Test B', false, 9002);

insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000a', 'authenticated', 'authenticated',
   'test-a@example.test', '{"name":"Test A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-00000000000b', 'authenticated', 'authenticated',
   'test-b@example.test', '{"name":"Test B"}', now(), now());
insert into public.admins (user_id) values ('bbbbbbbb-0000-0000-0000-00000000000b');

do $$ begin
  if (select count(*) from public.profiles where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a') <> 1
    then raise exception 'FAIL trigger: no profile for new user'; end if;
  if (select count(*) from public.deployment_checklist where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a'
      and item_key like 'zz_test_%') <> 2
    then raise exception 'FAIL trigger: checklist not copied'; end if;
end $$;

-- old updated_at so the trigger is visible (now() is fixed inside one transaction)
insert into public.companies (id, slug, name, is_published, updated_at) values
  ('c0000000-0000-0000-0000-000000000001', 'zz-test-pub', 'Test Published', true, now()),
  ('c0000000-0000-0000-0000-000000000002', 'zz-test-hidden', 'Test Hidden', false, '2000-01-01');
insert into public.opportunities (id, slug, company_id, title, is_published) values
  ('d0000000-0000-0000-0000-000000000001', 'zz-test-pub-role', 'c0000000-0000-0000-0000-000000000001', 'Pub', true),
  ('d0000000-0000-0000-0000-000000000002', 'zz-test-hidden-role', 'c0000000-0000-0000-0000-000000000002', 'Hidden', false);
insert into public.hte_list_entries (list_version, entry_no, name_as_listed, normalized_name)
  values ('TEST', 1, 'TEST CO', 'test');
insert into public.applications (user_id, company_name_manual) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'A app'), ('bbbbbbbb-0000-0000-0000-00000000000b', 'B app');

-- ---------- anonymous visitor ----------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  if (select count(*) from public.opportunities where slug like 'zz-test-%') <> 1
    then raise exception 'FAIL anon: should see only the published opportunity'; end if;
  if (select count(*) from public.companies where slug like 'zz-test-%') <> 1
    then raise exception 'FAIL anon: should see only the published company'; end if;
  if (select count(*) from public.opportunity_listing where slug like 'zz-test-%') <> 1
    then raise exception 'FAIL anon: listing view leaks unpublished rows'; end if;
  if (select count(*) from public.hte_list_entries) <> 0
    then raise exception 'FAIL anon: HTE list visible while hte_list_public is false'; end if;
  begin
    perform 1 from public.profiles limit 1;
    raise exception 'FAIL anon: could read profiles';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.applications limit 1;
    raise exception 'FAIL anon: could read applications';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------- normal signed-in user A ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ declare n int; begin
  if (select count(*) from public.applications) <> 1
    then raise exception 'FAIL user: should see only own application'; end if;
  if (select count(*) from public.profiles) <> 1
    then raise exception 'FAIL user: should see only own profile'; end if;
  if (select count(*) from public.admins) <> 0
    then raise exception 'FAIL user: can see admin rows'; end if;
  if (select count(*) from public.opportunities where slug like 'zz-test-%') <> 1
    then raise exception 'FAIL user: sees unpublished opportunity'; end if;

  update public.applications set notes = 'x' where company_name_manual = 'B app';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL user: updated someone else''s application'; end if;

  begin
    insert into public.opportunities (slug, company_id, title)
      values ('zz-test-hack', 'c0000000-0000-0000-0000-000000000001', 'hack');
    raise exception 'FAIL user: inserted an opportunity';
  exception when insufficient_privilege then null; end;

  insert into public.submissions (type, opportunity_id, submitted_by)
    values ('post_closed', 'd0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-00000000000a');
  begin
    insert into public.submissions (type, submitted_by, status)
      values ('correction', 'aaaaaaaa-0000-0000-0000-00000000000a', 'approved');
    raise exception 'FAIL user: self-approved a submission';
  exception when insufficient_privilege then null; end;
  update public.submissions set status = 'approved';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL user: approved a submission'; end if;
  begin
    insert into public.submissions (type, submitted_by)
      values ('correction', 'bbbbbbbb-0000-0000-0000-00000000000b');
    raise exception 'FAIL user: submitted as someone else';
  exception when insufficient_privilege then null; end;

  insert into public.open_checks (opportunity_id, user_id, result)
    values ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-00000000000a', 'opened_and_open');
  begin
    insert into public.open_checks (opportunity_id, user_id, result)
      values ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-00000000000a', 'link_dead');
    raise exception 'FAIL user: checked an unpublished opportunity';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.open_check_history('d0000000-0000-0000-0000-000000000001')) <> 1
    then raise exception 'FAIL user: open check history wrong'; end if;
end $$;
reset role;

-- ---------- admin user B ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}';
do $$ begin
  if (select count(*) from public.opportunities where slug like 'zz-test-%') <> 2
    then raise exception 'FAIL admin: should see unpublished opportunities'; end if;
  if (select count(*) from public.applications) <> 1
    then raise exception 'FAIL admin: admins must not see other users'' applications'; end if;
  if (select count(*) from public.hte_list_entries where list_version = 'TEST') <> 1
    then raise exception 'FAIL admin: cannot read HTE list'; end if;
  insert into public.hte_list_entries (list_version, entry_no, name_as_listed, normalized_name)
    values ('TEST', 2, 'TEST TWO', 'test two');
  update public.companies set name = 'Renamed' where slug = 'zz-test-hidden';
  if (select updated_at from public.companies where slug = 'zz-test-hidden') <= '2000-01-02'
    then raise exception 'FAIL admin: updated_at trigger did not run'; end if;
  update public.submissions set status = 'approved', reviewed_by = 'bbbbbbbb-0000-0000-0000-00000000000b';
  if (select count(*) from public.submissions where status = 'approved') <> 1
    then raise exception 'FAIL admin: could not review submission'; end if;
end $$;
reset role;

do $$ begin
  if public.normalize_company_name('KMC MAG Solutions, Inc.') <> 'kmc mag solutions'
    then raise exception 'FAIL normalize: %', public.normalize_company_name('KMC MAG Solutions, Inc.'); end if;
end $$;

select 'ALL P1 ACCESS CHECKS PASSED' as result;
rollback;
