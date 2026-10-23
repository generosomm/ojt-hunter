# OJT Hunter: Product

Full spec: [docs/spec.md](docs/spec.md). This file is the short version plus decisions made after it.

## Problem
NU Laguna BSIT students hunting for a 600-hour OJT (start ~Nov 10, 2026) keep re-checking the same
things: real allowance, whether the company is on the NU Laguna HTE list, onsite/hybrid (remote is not
allowed), required hours, intake month, whether the post is still open, and a usable HR contact.

## Users and roles
- **Visitor (no login):** browse directory, filters, company/opportunity pages, partnership checker,
  MOA board, cold-email list with "do not use" warnings, form tips, generic template previews.
- **Signed-in student (Google):** private profile, application tracker, deployment checklist,
  filled templates, "still open?" checks, submissions, "I also need this MOA".
- **Admin (owner):** review queue, edit listings, CSV import, partnership status. Admins come from
  the `ADMIN_EMAILS` env var, checked server side and in RLS.

## Critical flow
Open shared Messenger link on phone > filter (city, setup, min allowance, HTE partner, fits my hours)
> open opportunity > see apply route, contact status, school requirements > apply via original link
or copy a filled email > save to tracker with follow-up date.

## Non-negotiable data rules
- Never invent company data, allowances, emails or partnership status. Unknown stays unknown.
- "Not disclosed" is not "unpaid" and never sorts as zero. "Not on the AY 2026-27 list" never means "no MOA".
- Partnership is campus specific (KPMG had NU Manila only).
- Bounced and help-desk addresses show only as "do not use", never with a copy button.
- Tracker, profile, notes and checklist are private to their owner. Public pages never show who applied where.
- No em dashes in UI copy or templates. No scraping.

## MVP
All of Phases 0 to 7 in [docs/sprint-plan.md](docs/sprint-plan.md), built in order (owner's decision,
2026-10-23). Later, not MVP: email reminders, AI drafting, PDF parsing of HTE lists, notifications,
resume upload, inbox integration, scraping.

## Acceptance examples
- Filtering "hybrid, Makati, min PHP 300/day, HTE partners only" returns only matching rows, keeps
  "not disclosed" rows only when that toggle is on, and the URL reproduces the same view.
- Searching "KPMG" in the partnership checker returns "not found in the AY 2026-2027 list" with next
  steps, not "no MOA".
- A logged-out visitor cannot read anyone's tracker; a normal user cannot approve submissions.
