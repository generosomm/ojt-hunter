# Sprint plan and ledger

Order follows [spec.md](spec.md) section 9 (owner chose the full phased order on 2026-10-23).
Timing risk: OJT deployment is ~Nov 10, so classmates may need the directory before Phase 7 lands.
Phases 2 and 3 are already public and shareable once deployed.

| ID | Outcome | Acceptance summary | Depends | Status | Record / tests |
|---|---|---|---|---|---|
| P0 | Setup: empty Next.js 16 app live on Vercel, Supabase + Google auth wired | Live URL loads; Google sign-in round trip works; no secrets in repo | none | Done | [P0](sprints/P0.md) / [tests](../tests/sprints/P0/README.md) |
| P1 | Database: all tables, enums, RLS, indexes, per-day allowance estimate, curated seed (unpublished) | Migrations apply clean; RLS denies cross-user reads; seed counts match the merge rule; no `fit_note` in repo | P0 | Done | [P1](sprints/P1.md) / [tests](../tests/sprints/P1/README.md) |
| P2 | Directory + filters + company/opportunity pages (public) | Filters in URL; "not disclosed" handled; remote hidden by default; works at 375px | P1 | Implemented | [P2](sprints/P2.md) / [tests](../tests/sprints/P2/README.md) |
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

## Carry-over for later phases
- P3: KPMG has no role, so the role publish switch never shows it. The MOA board needs a company-level publish.
- P4: the owner's profile hours are empty, so "fits my hours" uses the 600-hour default (Annex at 800 shows as outside). The profile page fixes it.
- P6 (before writing them): `opportunity_listing` (via `o.*`) and `moa_requests` expose `created_by` and `last_checked_by` to the public API. Drop them from the view or use column grants so classmates' ids are never public.
- P7: not-found pages return status 200 with `noindex` while streaming; a true 404 needs a Proxy check.

## Current handoff
P2 is live with all 44 roles published (40 companies). Left: owner checks the look on a real phone,
and a classmate confirms sign-in. Then P3.
