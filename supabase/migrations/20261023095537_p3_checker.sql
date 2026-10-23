-- P3: HTE checker search, school resource links (data, not code).

-- Links shown on the checker (school toolkit, partnership brief...). Admin-edited, public read.
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null check (url ~ '^https://'),
  detail text,
  sort_order int not null default 0
);
alter table public.resources enable row level security;
revoke all on public.resources from anon, authenticated;
grant select on public.resources to anon, authenticated;
grant insert, update, delete on public.resources to authenticated;
grant all on public.resources to service_role;
create policy "read resources" on public.resources for select using (true);
create policy "admin inserts resources" on public.resources for insert to authenticated with check ((select private.is_admin()));
create policy "admin updates resources" on public.resources for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin deletes resources" on public.resources for delete to authenticated using ((select private.is_admin()));

-- Fuzzy match against the current HTE list. Runs as the caller, so the list's public switch still applies.
create or replace function public.search_hte(q text)
returns table (entry_no int, name_as_listed text, score real)
language sql stable security invoker set search_path = '' as $$
  with n as (select public.normalize_company_name(q) as nq)
  select e.entry_no, e.name_as_listed,
    greatest(extensions.similarity(e.normalized_name, n.nq), extensions.word_similarity(n.nq, e.normalized_name)) as score
  from public.hte_list_entries e
  cross join n
  join public.app_config c on c.hte_list_version = e.list_version
  where length(n.nq) >= 2
    and (e.normalized_name like '%' || n.nq || '%' or extensions.word_similarity(n.nq, e.normalized_name) > 0.45)
  order by (e.normalized_name = n.nq) desc, score desc, e.entry_no
  limit 8;
$$;

-- Companies we track whose brand, legal name or an alias matches (published ones for the public).
create or replace function public.search_companies(q text)
returns table (slug text, name text, legal_name text, partnership_status public.partnership_status, matched_name_as_listed text, notes text)
language sql stable security invoker set search_path = '' as $$
  with n as (select public.normalize_company_name(q) as nq)
  select co.slug, co.name, co.legal_name, p.status, p.matched_name_as_listed, p.notes
  from public.companies co
  cross join n
  join public.app_config c on true
  left join public.partnerships p on p.company_id = co.id and p.campus = c.campus
  where length(n.nq) >= 2 and (
    public.normalize_company_name(co.name) like '%' || n.nq || '%'
    or public.normalize_company_name(co.legal_name) like '%' || n.nq || '%'
    or exists (select 1 from unnest(co.aliases) a where public.normalize_company_name(a) like '%' || n.nq || '%')
  )
  order by co.name
  limit 6;
$$;

revoke all on function public.search_hte(text) from public;
revoke all on function public.search_companies(text) from public;
grant execute on function public.search_hte(text) to anon, authenticated;
grant execute on function public.search_companies(text) to anon, authenticated;
