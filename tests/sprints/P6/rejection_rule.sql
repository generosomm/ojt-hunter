-- P6 test: after a "post closed" item is rejected, only newer reports count toward the next one.
begin;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'b@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-0000-0000-0000-00000000000d', 'authenticated', 'authenticated', 'd@example.test', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-0000-0000-00000000000e', 'authenticated', 'authenticated', 'e@example.test', '{}', now(), now());
insert into public.companies (id, slug, name, is_published) values ('c0000000-0000-0000-0000-000000000001', 'zz-test-co', 'ZZ', true);
insert into public.opportunities (id, slug, company_id, title, is_published) values ('d0000000-0000-0000-0000-000000000001', 'zz-r', 'c0000000-0000-0000-0000-000000000001', 'R', true);
insert into public.open_checks (opportunity_id, user_id, result, checked_at) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-00000000000a', 'link_dead', now() - interval '2 days'),
  ('d0000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-00000000000b', 'link_dead', now() - interval '2 days');
update public.submissions set status = 'rejected', reviewed_at = now() - interval '1 day' where opportunity_id = 'd0000000-0000-0000-0000-000000000001';
insert into public.open_checks (opportunity_id, user_id, result) values ('d0000000-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-00000000000d', 'link_dead');
do $$ begin
  if exists (select 1 from public.submissions where opportunity_id = 'd0000000-0000-0000-0000-000000000001' and status = 'pending')
    then raise exception 'FAIL: one new report re-queued a rejected item'; end if;
end $$;
insert into public.open_checks (opportunity_id, user_id, result) values ('d0000000-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-00000000000e', 'opened_but_closed');
do $$ begin
  if (select count(*) from public.submissions where opportunity_id = 'd0000000-0000-0000-0000-000000000001' and status = 'pending') <> 1
    then raise exception 'FAIL: two new reports did not re-queue'; end if;
end $$;
select 'REJECTION RULE PASSED' r;
rollback;
