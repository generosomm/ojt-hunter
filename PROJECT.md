# OJT Hunter: Project

## Stack (decided 2026-10-23)
- **Next.js 16** (App Router) + TypeScript + Tailwind CSS. Spec said 15; owner chose 16 (current stable 16.4.2).
- **Supabase**: Postgres, Auth (Google only), Row Level Security on every table.
- Server Actions / Route Handlers for writes. `zod` for validation, `papaparse` for CSV import.
- Hosting: **Vercel Hobby**. Repo: **public GitHub repo** (owner's choice).
- No paid AI API. Templates are plain string templates.

## Folder map
- `app/`: routes. `app/auth/callback` (Google code exchange), `app/auth/signout` (POST).
- `lib/supabase/`: `client.ts` (browser), `server.ts` (per request), `env.ts` (public env vars).
- `proxy.ts`: Next 16's renamed middleware; refreshes the session cookie only, not authorization.
- `components/`: shared UI.
- `supabase/migrations/`: schema and access rules. File names match the versions recorded in the
  Supabase project (`list_migrations`); keep them in sync when adding one.
- `supabase/seed/listings.mjs`: the curated, public-safe seed data (edit here, not in seed.sql).
  `node scripts/build-seed.mjs` validates it and writes `supabase/seed.sql` (one-time import).
- `supabase/seed/hte_list_2026-27.csv`: the school's HTE list (owner confirmed it can be public, 2026-10-23).
- `tests/sprints/P1/rls.sql`: access-rule test, runs in a rolled-back transaction.
- `private/` (gitignored): anything personal, e.g. the owner's own tracker rows.
- Data model: everything shown in the app comes from the database. Tunable numbers (campus, HTE
  version, 22 days/month, 8 hours/day, 600 default hours, 14-day re-check, HTE list public switch)
  live in the single `app_config` row. Admins are rows in `admins`, added once in the SQL editor.
- Next 16 runs with `cacheComponents: true`: anything that reads cookies or `searchParams` goes inside
  `<Suspense>`. Next's own docs ship in `node_modules/next/dist/docs/` (see AGENTS.md).

## Public repo rules (read before every commit)
This repo is public, so anything committed is published.
- Never commit: `.env*` (except `.env.example`), the Supabase service role key, the owner's
  about-me file, resume, grades, OJT handoff, lessons file sections 4 and 5, or anything from the
  school's "Sir eds" folder.
- Raw source CSVs stay outside the repo (`D:\Downloads\Intern`). Phase 1 writes **scrubbed** copies
  to `supabase/seed/`: no `fit_note` column, no application status, no personal recruiter names,
  phones or private addresses.
- The NU Laguna HTE list and school Drive links: owner confirmed on 2026-10-23 that the FIC allows
  them to be public. `app_config.hte_list_public` can hide the list again without a code change.
- The owner's own tracker rows load through a gitignored script in `private/`, never committed SQL.
- Test data in the repo uses an obviously fake student.

## Environments
`.env.local` (local, gitignored) and Vercel project settings. Names are in `.env.example`:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...` or legacy
anon key; browser safe, protected by RLS), and from P1 `SUPABASE_SECRET_KEY` (server only, never
`NEXT_PUBLIC_`) and `ADMIN_EMAILS`. Values never go in git or chat.

## Known platform limits
- Supabase Free pauses a project after ~7 days of low activity; restore from the dashboard, no data loss.
  Fine while classmates use it daily. One unofficial source mentions a free-tier change on 2026-10-30
  where REST API access may need explicit table grants: check Supabase's changelog in Phase 1.
- Google sign-in: request only `openid email profile` (no verification needed for these) and publish
  the OAuth consent screen to production. Testing mode has a test-user list and consents that
  expire after 7 days, so don't leave it there.
- Folder is inside OneDrive. OneDrive syncing `node_modules` and `.next` can be slow or lock files.
  If that happens, pause OneDrive sync for this folder or move the project to a non-synced folder.

## Workflow
One phase per session. Each phase: short plan, build, `npm run build` passes, manual test checklist,
git commands to commit and push. Ledger: [docs/sprint-plan.md](docs/sprint-plan.md). Tests:
[docs/testing.md](docs/testing.md).

## Column-level permissions (P6)
`opportunities`, `moa_requests`, `partnerships` and `fact_sources` grant public reads per column, so columns
that point at a person (`created_by`, `last_checked_by`, `updated_by`, `added_by`) are never readable.
A new column on these tables is invisible to visitors until you add it to the grant (and to
`opportunity_listing`, which names its columns). Expect "permission denied" until you do.
