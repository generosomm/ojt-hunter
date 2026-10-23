# P3 tests

| Acceptance | Check | Status |
|---|---|---|
| MOA support is private, counts public, anon search works | `moa_and_search.sql` (rolled back) | passed 2026-10-23 |
| Checker states | `/partnership-checker?q=`: `isla lipana` and `Globe` show "On the list"; `deloite` shows "No exact match. Did you mean"; `kpmg` and `Accenture` show "Not found ... does not mean there is no MOA" plus the company card (KPMG: MOA requested, NU Manila note) | passed 2026-10-23 (local HTML) |
| MOA board | KPMG request with date, source and an "I need this too" button | passed 2026-10-23 (local HTML) |
| HR emails | Usable list with copy buttons; "Do not use" shows both bounce codes | passed 2026-10-23 (local HTML) |
| School links | Toolkit, partnership brief and HTE list links render from `resources` | passed 2026-10-23 |
| Build | `npm run build`, `tsc`, `lint` | passed 2026-10-23 |
| Signed-in button flow | Tap "I need this too" on a phone while signed in | pending (owner) |
