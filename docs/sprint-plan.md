# Sprint plan and ledger

Order follows [spec.md](spec.md) section 9, one phase per session (owner chose the full phased
order on 2026-10-23). Timing risk: OJT deployment is ~Nov 10, so classmates may need the directory
before Phase 7 lands. Phases 2 and 3 are already public and shareable once deployed.

| ID | Outcome | Acceptance summary | Depends | Status | Record / tests |
|---|---|---|---|---|---|
| P0 | Setup: empty Next.js 16 app live on Vercel, Supabase + Google auth wired | Live URL loads; Google sign-in round trip works; no secrets in repo | none | Done | [P0](sprints/P0.md) / [tests](../tests/sprints/P0/README.md) |
| P1 | Database: all tables, enums, RLS, indexes, per-day allowance column, scrubbed seed import (unpublished) | Migrations apply clean; RLS denies cross-user reads; seed rows match CSV counts; no `fit_note` in repo | P0 | Ready | |
| P2 | Directory + filters + company/opportunity pages (public) | Filters in URL; "not disclosed" handled; remote hidden by default; works at 375px | P1 | Planned | |
| P3 | Partnership checker + MOA board + cold-email list | Alias/fuzzy match; careful "not found" wording; bounced shown only as "do not use" | P1 | Planned | |
| P4 | Auth + profile + private tracker + deployment checklist | Owner-only access by RLS; follow-ups due today highlighted; checklist "can do now" filter | P1 | Planned | |
| P5 | Templates page | Fills from profile only; subject/body copy; pre-send checklist; no em dashes | P4 | Planned | |
| P6 | Submissions, "still open?" checks, admin review queue, CSV import | Normal user cannot approve; 2 dead-link reports flag for admin, never auto-close | P4 | Planned | |
| P7 | Polish: share links, OG image, loading/error pages, Vercel Analytics, README for friends | Messenger preview renders; 404 returns 404; measured mobile Lighthouse | P2-P6 | Planned | |

## Owner to-dos (not blocking P0)
- **Ask Sir Eds now** whether the HTE list, the school Drive links and form names can be shown publicly.
  Blocks the P1 public-read policy on `hte_list_entries` and P3 going live: the public partnership
  checker shows the list no matter what the repo holds. If the answer is no, the checker needs login
  or must only show match results, which changes the product.
- Confirm the Annex Digital HR address and Globe's brand-manager post address were in public posts. If not,
  they go in private tracker notes, not public `company_contacts` (decide before P1 seed).
- Use `D:\Downloads\Intern\03_OJT_CONTEXT_AND_LESSONS.md` (root copy). The copy inside
  `OJT Hunter Website\` is older and missing the contacts table, bounces and the NU Manila point.

## Current handoff
P0 done 2026-10-23: live at https://ojthunter.vercel.app with Google sign-in. Open item: a classmate
confirms sign-in. Next: P1 (database) in a new session. Before the P1 seed, settle the Sir Eds
and contact-address to-dos above.
