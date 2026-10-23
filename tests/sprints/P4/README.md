# P4 tests

| Acceptance | Check | Status |
|---|---|---|
| Owner-only tracker, profile, checklist; no duplicate saves (using the exact `on conflict (user_id, opportunity_id)` the app sends); manual entries unaffected; hours check | `tracker_access.sql` (rolled back) | passed 2026-10-23 after fix: the first version used an untargeted `on conflict` and missed that the partial index broke Save to tracker (42P10) |
| Signed-out gate | `/me/tracker`, `/me/checklist`, `/me/profile` show "Sign in to see your ..."; `/me` redirects to the tracker | passed 2026-10-23 (local HTML) |
| Save button | Role pages render "Save to tracker" | passed 2026-10-23 (local HTML) |
| Owner data | 40 rows (19 applied, 16 saved, 1 interview, 1 offered, 2 declined, 1 closed); profile 600/800 | passed 2026-10-23 |
| Build | `npm run build`, `tsc`, `lint` | passed 2026-10-23 |
| Signed-in flow on a phone | Change a status, add a follow-up, add a company, tick a checklist item, save profile with a bad URL (error stays, input kept) | pending (owner) |
