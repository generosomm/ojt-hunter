# P7 tests

| Acceptance | Check | Status |
|---|---|---|
| True 404 | Live: `/opportunities/nope` and `/companies/nope` return 404; `/opportunities/security-bank-star-it`, `/companies/kpmg`, `/` return 200 | passed 2026-10-23 |
| Share preview | Live `og:image` = https://ojthunter.vercel.app/opengraph-image, 200 image/png, reviewed visually | passed 2026-10-23 |
| robots + sitemap | Live robots.txt disallows /me /admin /submit /auth; sitemap has 91 URLs (6 pages, 44 roles, 41 companies) | passed 2026-10-23 |
| Lighthouse (mobile, live home) | `npx lighthouse@12 --form-factor=mobile` via Edge: before fix Perf 90 / CLS 0.108; after fix Perf 93 and 96, A11y 100, BP 100, SEO 100, CLS 0.005 | passed 2026-10-23 (lab, emulated phone) |
| Tracker row on phones | Repro at 330px: dropdown stretches to 188px, icons at the right edge; desktop unchanged | passed 2026-10-23 (owner reported) |
| Build | `npm run build`, `tsc`, `lint`, `npm test` | passed 2026-10-23 |
| Analytics enabled | Vercel project > Analytics > Enable, then a visit shows up | pending (owner) |
| Messenger preview | Paste the link in a chat | pending (owner) |

## Link checker and job boards (2026-10-24)

| Test | How | Result |
| --- | --- | --- |
| Verdicts: 404/410 and "closed" text dead, 2xx/3xx ok, 403/429/999/timeout blocked | `link_checker.sql` | pass |
| Anon can read boards and link status, can't run the checker or add boards | `link_checker.sql` | pass |
| Signed-in student can't add boards; board URL must be https with {q} | `link_checker.sql` | pass |
| Two dead answers for one role open one review item | `link_checker.sql` | pass |
| Board search URL encodes and trims the words | `npm test` (board-url.test.ts) | 3 pass |
| Live run against all 38 links | manual `start` then `collect` | 9 ok, 4 dead, 25 blocked; matches manual curl and browser checks |
