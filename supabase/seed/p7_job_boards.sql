-- "Find it on" search links. {q} becomes the encoded search words. Admins can add more boards as rows.
insert into public.job_boards (name, search_url, sort_order) values
  ('LinkedIn', 'https://www.linkedin.com/jobs/search/?keywords={q}&location=Philippines', 1),
  ('JobStreet', 'https://ph.jobstreet.com/jobs?keywords={q}', 2),
  ('Indeed', 'https://ph.indeed.com/jobs?q={q}', 3),
  ('Google', 'https://www.google.com/search?q={q}&ibp=htl;jobs', 4)
on conflict (name) do update set search_url = excluded.search_url, sort_order = excluded.sort_order;
