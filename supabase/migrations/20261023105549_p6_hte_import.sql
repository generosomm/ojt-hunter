-- P6: admin imports a new HTE list version in one transaction; optionally makes it the current list.
create or replace function public.admin_import_hte(version text, entries jsonb, make_current boolean)
returns int language plpgsql security invoker set search_path = '' as $$
declare
  added int;
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can import.' using errcode = '42501';
  end if;
  if coalesce(btrim(version), '') = '' then raise exception 'Add a list version, e.g. AY 2027-2028.'; end if;
  if exists (select 1 from public.hte_list_entries where list_version = version) then
    raise exception 'Version "%" already exists. Use a new version name.', version;
  end if;

  insert into public.hte_list_entries (list_version, entry_no, name_as_listed, normalized_name)
  select version, (e ->> 'no')::int, btrim(e ->> 'name'), public.normalize_company_name(e ->> 'name')
  from jsonb_array_elements(entries) e
  where coalesce(btrim(e ->> 'name'), '') <> '';
  get diagnostics added = row_count;

  if make_current then
    update public.app_config set hte_list_version = version;
  end if;
  return added;
end $$;
revoke all on function public.admin_import_hte(text, jsonb, boolean) from public, anon;
grant execute on function public.admin_import_hte(text, jsonb, boolean) to authenticated;
