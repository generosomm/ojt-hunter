-- P5: email and cover letter templates as data. Placeholders: {{name}}; {{name?}} drops the line when empty.
create table public.email_templates (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  name text not null,
  use_when text not null,
  subject text,
  body text not null check (position('—' in body) = 0 and position('—' in coalesce(subject, '')) = 0),
  needs_resume boolean not null default false,
  asks_questions boolean not null default false,
  sort_order int not null default 0
);
alter table public.email_templates enable row level security;
revoke all on public.email_templates from anon, authenticated;
grant select on public.email_templates to anon, authenticated;
grant insert, update, delete on public.email_templates to authenticated;
grant all on public.email_templates to service_role;
create policy "read templates" on public.email_templates for select using (true);
create policy "admin inserts templates" on public.email_templates for insert to authenticated with check ((select private.is_admin()));
create policy "admin updates templates" on public.email_templates for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin deletes templates" on public.email_templates for delete to authenticated using ((select private.is_admin()));
