# P6 tests

| Acceptance | Check | Status |
|---|---|---|
| User ids hidden; still-open rules; admin-only review; approve applies atomically | `review_access.sql` (rolled back) | passed 2026-10-23 |
| HTE import: admin only, blank rows skipped, normalized, becomes current, unique versions | `hte_import.sql` (rolled back) | passed 2026-10-23 |
| Live site unaffected by column grants | Role, company, MOA pages load data; anon counts work | passed 2026-10-23 |
| Signed-out gates and buttons | `/submit`, `/admin`, `/admin/import` show sign-in; role page shows still-open buttons, no admin editor | passed 2026-10-23 (local HTML) |
| Build | `npm run build`, `tsc`, `lint`, `npm test` | passed 2026-10-23 |
| Signed-in flows | Owner sends an update, approves it in /admin, edits a role, imports a 2-row CSV | pending (owner) |
| Rejection rule | `rejection_rule.sql`: after a rejection, one new report does not re-queue; two new reports do | passed 2026-10-23 |
| Admin partnership edit | `partnership_edit.sql`: non-admin denied; admin update-by-id and insert work under column grants (the first upsert version failed 42501 and was replaced) | passed 2026-10-23 |
| Tracker embed after view rebuild | PostgREST as anon: `opportunity_listing?select=slug,companies(name)` returns data; `applications(...)` returns 42501, not PGRST200 | passed 2026-10-23 |
