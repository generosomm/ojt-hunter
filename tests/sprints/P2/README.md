# P2 tests

| Acceptance | Check | Status |
|---|---|---|
| Build | `npm run build`, `npx tsc --noEmit`, `npm run lint` | passed 2026-10-23 |
| Filter URLs | `/?min=300&nd=1&hte=1&role=dev,qa&sort=new` and `/?q=')or(x` load with a role count | passed 2026-10-23 (local) |
| Drafts hidden | Signed out, `/opportunities/annex-digital-qa-intern` and `/companies/kpmg` show "Not here" | passed 2026-10-23 (status 200 + noindex, see P2 limits) |
| Mobile layout | 375px viewport emulation: hero card, search, filter button, empty state | passed 2026-10-23 (emulation only) |
| Cards with data | Signed in as admin on the live site, drafts render with the Draft badge | pending (owner) |
| Publish switch | Admin publishes a role; it appears signed out | pending |
| Real phone | Tilt, bottom sheet, tap targets on a real phone | pending |
