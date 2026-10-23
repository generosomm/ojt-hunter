-- The partial unique index cannot back "on conflict (user_id, opportunity_id)" (error 42P10), which the
-- Save to tracker upsert sends. A plain unique constraint works; NULL opportunity_id (manual entries) never conflicts.
drop index public.applications_user_opportunity_uniq;
alter table public.applications add constraint applications_user_opportunity_key unique (user_id, opportunity_id);
-- (a one-row data correction to the owner's private tracker was applied with this migration and is kept in private/)
