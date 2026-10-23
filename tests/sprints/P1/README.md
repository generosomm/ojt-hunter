# P1 tests

| Acceptance | Check | Status |
|---|---|---|
| Access rules (anon, user, admin, trigger) | Run `rls.sql` in the Supabase SQL Editor or via MCP `execute_sql`. Prints `ALL P1 ACCESS CHECKS PASSED`; any failure raises `FAIL ...`. Rolled back. | passed 2026-10-23 |
| Seed data valid | `node scripts/build-seed.mjs` (fails on bad enums, unknown companies, missing HTE entries, amounts on undisclosed allowances, em dashes) | passed 2026-10-23 |
| Seed counts | After import: `select count(*)` per table matches the P1 merge rule | pending |
| Advisors | Supabase security + performance advisors | reviewed 2026-10-23 |

Not covered yet: app-level reads through the Data API (P2 adds them).
