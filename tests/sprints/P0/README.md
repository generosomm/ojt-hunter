# P0 tests

No automated tests yet (only setup code). Manual checks map to [P0 acceptance](../../../docs/sprints/P0.md):

| Acceptance | Check | Status |
|---|---|---|
| Build passes | `npm run build`, `npm run lint` | passed 2026-10-23 |
| Phone load | Open Vercel URL on a real phone (not only viewport emulation) | pending |
| Sign-in round trip | Sign in and out on localhost and Vercel URL | localhost passed 2026-10-23; Vercel pending |
| Non-test-user sign-in | A classmate's Google account can sign in | pending |
| No secrets | `git grep -nE "service_role|eyJ|sb_secret_" -- . ":!*.md" ":!package-lock.json"` returns nothing; check `.env.example` has names only (the lockfile is excluded because its integrity hashes can contain `eyJ`) | passed 2026-10-23 before first commit; rerun before every push |
