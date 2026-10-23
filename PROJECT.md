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
- Coming later: `supabase/migrations/`, `supabase/seed/` (scrubbed public seed only), `private/` (gitignored).
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
- The NU Laguna HTE list is a school document. Keep it in `private/` and import it locally until the
  FIC says it can be public. Same for the school Drive links.
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
