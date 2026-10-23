# P2 tests

| Acceptance | Check | Status |
|---|---|---|
| Build | `npm run build`, `npx tsc --noEmit`, `npm run lint` | passed 2026-10-23 |
| Filter URLs | `/?min=300&nd=1&hte=1&role=dev,qa&sort=new` and `/?q=')or(x` load with a role count | passed 2026-10-23 (local) |
| Drafts hidden | Signed out, `/opportunities/annex-digital-qa-intern` and `/companies/kpmg` show "Not here" | passed 2026-10-23 (status 200 + noindex, see P2 limits) |
| Mobile layout | 375px viewport emulation: hero card, search, filter button, empty state | passed 2026-10-23 (emulation only) |
| Cards with data | Live server HTML signed out: 39 cards (44 minus 4 closed, 1 remote); Security Bank ₱409–591, Cambridge ₱522 period unclear, QNE unpaid, Deloitte benefits only, Annex 800+ hrs, DW Morgan remote warning; company pages show "Do not use" with bounce codes | passed 2026-10-23 (HTML check; pane screenshots unavailable while hidden) |
| Publish | Owner approved publishing all 44 (40 companies; KPMG has no role). Bulk-published by SQL; the in-app switch is still untested by the owner | partly passed 2026-10-23 |
| Real phone | Tilt, bottom sheet, tap targets on a real phone | pending |
| Filter combo | `/?min=300&hte=1` returns only Security Bank on live data | passed 2026-10-23 |
