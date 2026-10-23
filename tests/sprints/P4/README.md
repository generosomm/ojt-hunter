# P4 tests

| Acceptance | Check | Status |
|---|---|---|
| Owner-only tracker, profile, checklist; no duplicate saves (using the exact `on conflict (user_id, opportunity_id)` the app sends); manual entries unaffected; hours check | `tracker_access.sql` (rolled back) | passed 2026-10-23 after fix: the first version used an untargeted `on conflict` and missed that the partial index broke Save to tracker (42P10) |
| Signed-out gate | `/me/tracker`, `/me/checklist`, `/me/profile` show "Sign in to see your ..."; `/me` redirects to the tracker | passed 2026-10-23 (local HTML) |
| Save button | Role pages render "Save to tracker" | passed 2026-10-23 (local HTML) |
| Owner data | 40 rows (19 applied, 16 saved, 1 interview, 1 offered, 2 declined, 1 closed); profile 600/800 | passed 2026-10-23 |
| Build | `npm run build`, `tsc`, `lint` | passed 2026-10-23 |
| Signed-in flow on a phone | Change a status, add a follow-up, add a company, tick a checklist item, save profile with a bad URL (error stays, input kept) | pending (owner) |
| Desktop board not cropped | At 1874x954 with 16 Saved cards: board 602px tall ends at 808px (dock at 880), page has no scroll, Saved scrolls inside, sideways scrollbar in view; padding keeps focus rings unclipped. Root cause: 7 columns need ~2090px in 1120px, and the sideways scrollbar sat below a 16-card column | passed 2026-10-23 (layout reproduction with the same classes; owner reported the bug) |
| Compact tracker list | Repro with 40 rows at 1874x954: rows 60px, 11 visible (was about 4 cards), no page overflow | passed 2026-10-23 |
| Phone width | Me tabs fit 375px (were 385px). Templates role dropdown no longer widens the page on phones (grid column was sized to the longest option) | passed 2026-10-23 (Me tabs measured in place; templates fix is the standard minmax(0,1fr) remedy, measured only with a manual stream reveal) |
