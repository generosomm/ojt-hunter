# Sprint plan and ledger

Order follows [spec.md](spec.md) section 9 (owner chose the full phased order on 2026-10-23).
Timing risk: OJT deployment is ~Nov 10, so classmates may need the directory before Phase 7 lands.
Phases 2 and 3 are already public and shareable once deployed.

| ID | Outcome | Acceptance summary | Depends | Status | Record / tests |
|---|---|---|---|---|---|
| P0 | Setup: empty Next.js 16 app live on Vercel, Supabase + Google auth wired | Live URL loads; Google sign-in round trip works; no secrets in repo | none | Done | [P0](sprints/P0.md) / [tests](../tests/sprints/P0/README.md) |
| P1 | Database: all tables, enums, RLS, indexes, per-day allowance estimate, curated seed (unpublished) | Migrations apply clean; RLS denies cross-user reads; seed counts match the merge rule; no `fit_note` in repo | P0 | In progress | [P1](sprints/P1.md) / [tests](../tests/sprints/P1/README.md) |
| P2 | Directory + filters + company/opportunity pages (public) | Filters in URL; "not disclosed" handled; remote hidden by default; works at 375px | P1 | Planned | |
| P3 | Partnership checker + MOA board + cold-email list | Alias/fuzzy match; careful "not found" wording; bounced shown only as "do not use" | P1 | Planned | |
| P4 | Auth + profile + private tracker + deployment checklist | Owner-only access by RLS; follow-ups due today highlighted; checklist "can do now" filter | P1 | Planned | |
| P5 | Templates page | Fills from profile only; subject/body copy; pre-send checklist; no em dashes | P4 | Planned | |
| P6 | Submissions, "still open?" checks, admin review queue, CSV import | Normal user cannot approve; 2 dead-link reports flag for admin, never auto-close | P4 | Planned | |
| P7 | Polish: share links, OG image, loading/error pages, Vercel Analytics, README for friends | Messenger preview renders; 404 returns 404; measured mobile Lighthouse | P2-P6 | Planned | |

## Owner decisions
- 2026-10-23: FIC allows the HTE list and school Drive links to be public (owner confirmed).
- 2026-10-23: the Annex Digital and Globe addresses came from public posts (owner confirmed).
- 2026-10-23: UI brief recorded in [DESIGN.md](../DESIGN.md); nothing hardcoded, data lives in the database.
- Use `D:\Downloads\Intern\03_OJT_CONTEXT_AND_LESSONS.md` (root copy). The copy inside
  `OJT Hunter Website\` is older and missing the contacts table, bounces and the NU Manila point.

## Current handoff
P1 schema and access rules are applied and tested. Seed is generated; waiting for the owner to run
`supabase/seed.sql` once in the Supabase SQL Editor, then verify counts. Open P0 item: a classmate
confirms sign-in.
