-- P7: truthful answers for common application-form questions (spec page 10b). Data, admin-edited.
create table public.form_tips (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null check (position('—' in answer) = 0),
  sort_order int not null default 0
);
alter table public.form_tips enable row level security;
revoke all on public.form_tips from anon, authenticated;
grant select on public.form_tips to anon, authenticated;
grant insert, update, delete on public.form_tips to authenticated;
grant all on public.form_tips to service_role;
create policy "read form tips" on public.form_tips for select using (true);
create policy "admin inserts form tips" on public.form_tips for insert to authenticated with check ((select private.is_admin()));
create policy "admin updates form tips" on public.form_tips for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin deletes form tips" on public.form_tips for delete to authenticated using ((select private.is_admin()));
