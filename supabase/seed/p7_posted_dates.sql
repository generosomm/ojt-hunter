-- P7: when each role was posted, read on 2026-10-24 from the board itself:
-- JobStreet and LinkedIn "datePosted" in the post's structured data, Kalibrr "activationDate".
-- Stored as the Manila calendar date. Roles not on a dated board (company pages, programs) stay null.
update public.opportunities o
set posted_on = (v.posted::timestamptz at time zone 'Asia/Manila')::date
from (values
  -- JobStreet
  ('95298654', '2026-10-15T09:00:49Z'), ('94283007', '2026-08-28T09:30:00Z'), ('94405837', '2026-09-03T10:00:00Z'),
  ('95382449', '2026-10-20T07:59:26Z'), ('95434686', '2026-10-22T06:28:43Z'), ('95172277', '2026-10-09T07:51:16Z'),
  ('95075883', '2026-10-06T02:29:00Z'), ('95265849', '2026-10-14T08:35:22Z'), ('95101112', '2026-10-07T01:00:55Z'),
  ('94879161', '2026-09-25T05:37:36Z'), ('95340376', '2026-10-19T01:33:30Z'), ('95416316', '2026-10-21T05:43:32Z'),
  ('95373480', '2026-10-20T04:01:50Z'), ('95296324', '2026-10-15T14:15:29Z'), ('95306118', '2026-10-16T02:52:51Z'),
  ('95352953', '2026-10-19T07:33:14Z'), ('95320247', '2026-10-16T09:22:18Z'), ('95319737', '2026-10-16T09:01:45Z'),
  ('95078245', '2026-10-06T03:25:34Z'), ('95195599', '2026-10-12T01:35:37Z'), ('95224632', '2026-10-13T01:53:11Z'),
  ('95236393', '2026-10-13T07:02:39Z'), ('95236845', '2026-10-13T07:14:22Z'), ('95237561', '2026-10-14T01:56:29Z'),
  ('95269052', '2026-10-14T11:04:57Z'), ('95314807', '2026-10-16T06:30:02Z'), ('95319848', '2026-10-16T09:02:47Z'),
  ('95345125', '2026-10-19T03:40:21Z'), ('95349461', '2026-10-19T05:47:14Z'), ('95353294', '2026-10-19T07:47:04Z'),
  ('95359390', '2026-10-19T06:30:00Z'), ('95359393', '2026-10-19T06:30:00Z'), ('95361557', '2026-10-19T03:50:32Z'),
  ('95401306', '2026-10-21T03:56:04Z'), ('95426398', '2026-10-22T03:06:54Z'), ('95439794', '2026-10-22T09:47:40Z'),
  ('95469567', '2026-10-15T13:47:09Z'),
  -- LinkedIn
  ('4477141538', '2026-10-08T09:43:23Z'), ('4405623772', '2026-10-12T14:29:59Z'), ('4478242607', '2026-10-19T04:06:08Z'),
  ('4450304528', '2026-10-10T13:30:01Z'), ('4349797967', '2026-10-11T17:17:38Z'), ('4450456167', '2026-10-16T16:52:42Z'),
  ('4411506299', '2026-10-11T16:20:49Z'), ('4450982555', '2026-08-09T20:52:39Z'), ('4469318632', '2026-09-23T15:49:14Z'),
  ('4469236701', '2026-09-18T20:31:05Z'), ('4372611834', '2026-10-22T15:37:30Z'), ('4482840571', '2026-10-23T06:55:03Z'),
  ('4474261164', '2026-10-05T08:29:24Z'), ('4457275804', '2026-10-08T13:52:25Z'), ('4482835558', '2026-10-23T06:55:47Z'),
  ('4482842280', '2026-10-23T06:41:02Z'), ('4470047953', '2026-10-22T02:00:31Z'), ('4469735034', '2026-09-24T10:11:59Z'),
  ('4473624989', '2026-10-12T21:46:13Z'), ('4440505876', '2026-10-07T12:54:03Z'), ('4480736035', '2026-10-20T21:05:40Z'),
  -- Kalibrr
  ('272620', '2026-09-30T00:16:36Z'), ('268377', '2026-08-19T09:08:27Z'), ('242741', '2026-08-11T02:24:12Z'), ('270929', '2026-10-15T03:07:08Z')
) as v(post_id, posted)
where o.apply_channel in ('jobstreet', 'linkedin', 'kalibrr')
  and (o.apply_url ~ ('(/|-)' || v.post_id || '($|/|\?)') or o.source_url ~ ('(/|-)' || v.post_id || '($|/|\?)'));

-- Posts that now say closed or expired on the board: one "post closed" review item each, never closed without review.
insert into public.submissions (type, opportunity_id, payload, evidence_note, submitted_by)
select 'post_closed', o.id, jsonb_build_object('source', 'date_check'), v.note, (select user_id from public.admins order by created_at limit 1)
from (values
  ('quisumbing-torres-it-intern', 'JobStreet shows this post as expired (checked 2026-10-24).'),
  ('dw-morgan-it-intern', 'JobStreet shows this post as expired (checked 2026-10-24).'),
  ('pwc-it-intern', 'LinkedIn says "No longer accepting applications" (checked 2026-10-24).')
) as v(slug, note)
join public.opportunities o on o.slug = v.slug
where o.post_status <> 'closed'
  and not exists (select 1 from public.submissions s where s.opportunity_id = o.id and s.type = 'post_closed' and s.status = 'pending');
