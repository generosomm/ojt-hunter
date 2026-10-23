-- P4: one tracker card per role per user (manual entries have no role and are not limited).
create unique index applications_user_opportunity_uniq on public.applications (user_id, opportunity_id) where opportunity_id is not null;
-- follow-ups due today are looked up per user
create index applications_user_follow_up_idx on public.applications (user_id, follow_up_on) where follow_up_on is not null;
