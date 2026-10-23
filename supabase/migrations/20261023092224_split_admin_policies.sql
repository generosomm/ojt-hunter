-- Admin "for all" policies also applied to SELECT, so signed-in reads ran two policies.
-- Split them into insert/update/delete; reads keep their single "read ..." policy (which already lets admins in).
do $$
declare
  t record;
begin
  for t in select * from (values
    ('hte_list_entries', 'admin writes hte list'),
    ('checklist_templates', 'admin writes checklist templates'),
    ('companies', 'admin writes companies'),
    ('company_contacts', 'admin writes contacts'),
    ('partnerships', 'admin writes partnerships'),
    ('moa_requests', 'admin writes moa requests'),
    ('opportunities', 'admin writes opportunities'),
    ('fact_sources', 'admin writes facts')
  ) as v(tbl, pol)
  loop
    execute format('drop policy %I on public.%I', t.pol, t.tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))',
      'admin inserts ' || t.tbl, t.tbl);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      'admin updates ' || t.tbl, t.tbl);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))',
      'admin deletes ' || t.tbl, t.tbl);
  end loop;
end $$;
