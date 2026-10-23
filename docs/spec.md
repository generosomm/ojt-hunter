> Copied from the original master prompt on 2026-10-23. This is the product spec.
> Changes since: Next.js 16 instead of 15 (see PROJECT.md). Context files named in Section 11
> (about-me, lessons, raw CSVs) are kept OUTSIDE this public repo on purpose.

# MASTER PROMPT: OJT Hunter (shared internship hunting dashboard)

> How to use: open a new Claude Code (or Claude.ai) session with Opus, attach this file plus
> `02_ABOUT_MERWIN.md`, `03_OJT_CONTEXT_AND_LESSONS.md`, `nu_laguna_hte_list_2026-27.csv`,
> `seed_internships_2026-10-22.csv` and `seed_internships_2026-10-23_handoff.csv`, then say: **"Read all attached files. Start with Phase 0."**
> Build one phase per session so you don't hit the Claude Pro usage limit mid-feature.

---

## 1. Role and goal

You are a senior full-stack engineer and product-minded mentor helping me (Merwin, a 4th year BSIT
student) vibe code a real web app. I will deploy it on Vercel and share the link with my classmates
at NU Laguna who still don't have an OJT company.

**Goal:** make OJT hunting faster by putting everything we keep re-checking in one place:
allowance, NU Laguna partnership (MOA/HTE) status, setup (onsite/hybrid/remote), required hours,
start date, whether the post is still open, and how to apply. Plus a private tracker for each user
and copy-ready email templates.

**Working style I want from you:**
- Explain decisions in simple, casual English (Taglish is ok). I'm a student, not a senior dev.
- Build in the phases in Section 9. At the end of each phase: list what was built, how to test it
  manually, and the exact git commands to commit and push. Then stop and wait for me.
- Before writing code for a phase, show a short plan (files to create/change, DB changes). Keep it short.
- Never invent company data, allowances, emails or partnership status. If unknown, store it as unknown.
- Never use em dashes in UI copy or templates.
- Ask me only when a choice changes the product. Otherwise pick the sensible default and tell me.

## 2. The real problems this app solves

These come from our actual OJT hunt in Oct 2026 (details in `03_OJT_CONTEXT_AND_LESSONS.md`):

| Problem we hit | Feature that fixes it |
|---|---|
| Posts scattered across Facebook, LinkedIn, JobStreet, Bossjob, Indeed, Prosple, company sites | One searchable directory with the original apply link |
| "Paid internship" with no amount | Allowance amount + basis (per day / per month / per hour) + "Not disclosed" status, auto-converted to per day |
| Companies not on the NU Laguna HTE list need a new MOA (KPMG, Meralco, Staff Domain, Solid Video, Global Transco) | Partnership checker + shared MOA request status |
| KPMG only had an MOA with **NU Manila, not NU Laguna**, and would not process a classmate without an existing campus MOA | Partnership status is campus-specific, shows its source, and opportunities record whether the employer requires an EXISTING campus MOA or accepts a new partner |
| NU Laguna allows **onsite or hybrid only**, fully remote is not allowed | Setup filter; remote roles hidden by default and labeled "Remote: not allowed for NU Laguna OJT" |
| Companies want 300, 500 or 800 hours (Annex Digital asked for 800) or 5 to 6 months vs our 600 hours | Required hours / duration + "fits my hours?" based on each user's required hours AND max hours they can extend to |
| OJT start is November 2026, but some programs start in January (KPMG Rising NextGen) | Intake month, earliest start, deadline, "accepts Nov start?" flag |
| Dead or cached job links that still look open | "Still open?" human check with last checked date and who checked |
| No public HR emails for most companies, and some emails bounced (Accenture campus email, UAS) or were help desk only (CGI, WTW) | Contacts with a status: reply received, published but untested, help desk only, bounced (never shown as usable) |
| Titles hiding repetitive or non-dev work (AI Rudder convo scoring, DSV service desk) | "Dev exposure" tag: high, some, low or repetitive, unknown |
| Old facts and conflicting sources (allowance from another role, old reviews, employer marketing) | Each key fact stores source type, date and state (confirmed, reported, historical, unknown), conflicts shown side by side |
| Rewriting the same email and cover letter again and again; JobStreet quick apply reusing an old company's cover letter; an email sent without the resume | Template-based drafts filled from the user's profile, with a pre-send checklist (right company name, resume attached, subject format) |
| Unsure how to answer application forms truthfully (prior internship, completed degree, tools) | Short "Form tips" page |
| Forgetting where we applied and when to follow up | Private application tracker with follow-up dates |
| AILPO deployment docs (medical, I-THRIVE, parent consent, MOU, deployment letter) | Personal deployment docs checklist, with "can do now even without a company" tags |

## 3. Tech stack (free tier friendly)

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS**, deployed on **Vercel** (Hobby plan).
- **Supabase**: Postgres database, Auth (Google sign-in only), Row Level Security (RLS).
- Server Actions or Route Handlers for writes. No separate backend.
- `zod` for validation. `papaparse` for CSV import. Keep dependencies minimal.
- Mobile first. Most of my friends will open the link from Messenger on their phones.
- No paid AI API in the MVP. Templates are plain string templates.
- Environment variables only in `.env.local` and Vercel project settings. Never commit keys.
  The Supabase service role key must never reach the browser.

If you think a different choice is clearly better for a student on free tiers, say why in two lines,
then follow my answer.

## 4. Access model

- **Public (no login):** browse directory, filters, company and opportunity pages, partnership
  checker, MOA request board (read only), email templates (generic preview).
- **Logged in (Google):** private application tracker, personal deployment docs checklist,
  profile used to fill templates, "still open?" checks, submit new opportunity, submit updates/reports,
  "I also need this MOA" button.
- **Admin (me):** review queue for submissions, edit any listing, CSV import, mark partnership status,
  manage the HTE list version. Admin = rows in a `admins` table (or a role column), checked
  server side and in RLS. Seed my Google account email as the first admin through an env var
  `ADMIN_EMAILS`, not hard coded in source.

Privacy rules:
- Tracker entries, profiles, notes and checklists are private to their owner (RLS: `user_id = auth.uid()`).
- Public pages never show who applied where.
- Contributor names on public updates show only a display name the user chose (or "A classmate").
- HR contact persons' personal numbers are never public. Only company published emails go on public pages.

## 5. Data model (Supabase / Postgres)

Keep **company** and **opportunity** separate. One company can have many roles with different
locations, allowances and requirements.

```
companies
  id, name (brand), legal_name, aliases text[] (for matching, e.g. "KPMG", "R.G. Manabat & Co."),
  website, careers_url, industry, hq_location, description (short, sourced),
  founded_year text null, size_text null, background_source, background_checked_on date,
  apply_route enum('direct_hr_email','portal_only','form','referral','unknown'),
  created_at, updated_at

company_contacts        -- only company-published addresses, never personal emails from private replies
  id, company_id, email, purpose enum('resume_intake','questions_only','help_desk','unknown'),
  status enum('reply_received','published_untested','bounced','wrong_purpose'),
  bounce_code text null, source, observed_on date, notes
  -- bounced / wrong_purpose contacts are shown only as a warning ("do not use"), never with a copy button

fact_sources            -- evidence trail for important fields, conflicts stay visible
  id, entity enum('company','opportunity','partnership'), entity_id, field text,
  value text, source_url text, source_type enum('official_post','company_site','hr_reply',
  'employee_review','employer_marketing','classmate_report','school_document'),
  state enum('confirmed','reported','historical','unknown'), observed_on date, added_by

partnerships            -- campus specific, never assume
  id, company_id, campus (default 'NU Laguna'),
  status enum('listed_in_hte','confirmed_by_school','confirmed_by_company',
              'not_listed','moa_requested','needs_clarification'),
  hte_list_entry_no int null, hte_list_version text (e.g. 'AY 2026-2027'),
  matched_name_as_listed text, source text, source_date date, notes, updated_by, updated_at

moa_requests            -- shared board so nobody duplicates
  id, company_id, campus, status enum('requested','in_progress','approved','rejected','unknown'),
  requested_on date, requested_via text (e.g. 'AILPO MOA QR form', 'via FIC'),
  last_update date, notes, created_by
moa_request_supporters  -- "I also need this MOA"
  moa_request_id, user_id, created_at

opportunities
  id, company_id, title, role_category enum('dev','qa','it_support','network','data','cyber',
    'automation','ui_ux','business_analyst','other'),
  duties text, tech_stack text[],
  dev_exposure enum('high','some','low_repetitive','unknown'),
  city, office_address, setup enum('onsite','hybrid','remote','unknown'), onsite_days_per_week int null,
  employment_type enum('full_time','part_time','unknown'),
  moa_requirement enum('existing_campus_moa_required','new_partner_ok','own_company_moa','unknown'),
  schedule_text (e.g. '6am to 3pm', 'shifting incl. nights'),
  allowance_amount numeric null, allowance_min numeric null, allowance_max numeric null,
  allowance_basis enum('per_day','per_month','per_hour','unknown'),
  allowance_status enum('disclosed','not_disclosed','unpaid','benefits_only'),
  allowance_per_day_est numeric (computed: month / 22, hour * 8),
  allowance_source text, allowance_verified bool,
  required_hours_min int null, required_hours_max int null, duration_text,
  -- "fits my hours?" is computed per user from profiles.required_hours and profiles.max_hours
  intake_text, earliest_start date null, deadline date null, accepts_nov_start enum('yes','no','ask'),
  school_requirements text (e.g. 'MOA + endorsement letter + medical cert'),
  apply_url, apply_channel enum('jobstreet','linkedin','indeed','prosple','kalibrr','company_portal','email','forms','facebook','other'),
  apply_instructions text (subject line format, attachments),
  post_status enum('open','closed','unconfirmed','recurring_program','no_post_cold_email'),
  last_checked_at timestamptz, last_checked_by uuid null,
  source_url text, created_by, created_at, updated_at, is_published bool

open_checks             -- "Still open?" human checks
  id, opportunity_id, user_id, result enum('opened_and_open','opened_but_closed','link_dead','redirected'),
  note, checked_at

submissions             -- everything public goes through review
  id, type enum('new_opportunity','post_closed','email_bounced','allowance_confirmed',
               'hours_confirmed','moa_clarification','correction'),
  opportunity_id null, company_id null, payload jsonb, evidence_url text, evidence_note text,
  submitted_by, status enum('pending','approved','rejected'), reviewed_by, reviewed_at

profiles                -- private
  user_id, display_name, full_name, school, campus, program, year_level, required_hours,
  max_hours (how far they can extend, e.g. 800), available_from date, expected_graduation date,
  preferred_cities text[], min_allowance_per_day numeric,
  location_base, willing_to_relocate bool, email, phone,
  skills text[], projects text, portfolio_url, linkedin_url, github_url, fic_name

applications            -- private tracker
  id, user_id, opportunity_id null, company_name_manual, role_manual,
  status enum('saved','applied','assessment','interview','offered','accepted',
              'declined','rejected','withdrawn','closed'),
  applied_on date, channel, follow_up_on date, interview_at timestamptz, interview_link,
  confirmed_allowance text, confirmed_schedule text, notes, decline_reason, updated_at

deployment_checklist    -- private, seeded per user from a template list
  id, user_id, item_key, label, can_do_without_company bool, status enum('todo','in_progress','done','na'),
  done_on date, notes

hte_list_entries        -- raw import of the school list
  id, list_version, entry_no, name_as_listed, normalized_name
```

Add RLS policies for every table. Public read only where `is_published = true` (opportunities)
and on companies, partnerships, moa_requests, hte_list_entries. Writes only by owner or admin.

## 6. Pages

1. **/ (Directory)**: compact cards. Each card shows: company + role, city + setup, allowance per day
   estimate or "Not disclosed", NU Laguna partnership badge, required hours + "fits my hours?",
   start/intake, post status, dev exposure tag, last checked ("checked 2 days ago"), apply link.
   **Filters:** city, role category, setup (remote hidden by default with a toggle to show it labeled
   "not allowed for NU Laguna OJT"), minimum allowance per day (with an "include not disclosed"
   toggle, unknown is NOT unpaid), partnership status, fits my hours (uses profile, falls back to 600),
   accepts Nov start, dev exposure, post status.
   Logged-in users get a "Matches me" toggle that applies their profile (cities, min allowance, hours).
   **Sort:** allowance, last checked, newest. Filters live in the URL query string so I can share a
   link like "Paid hybrid dev internships in Makati, HTE partners only" in Messenger.
2. **/companies/[id]**: company background (short, with source links), all its opportunities,
   partnership status with source + list version, MOA request status, contact type.
3. **/opportunities/[id]**: full details, duties, tech stack, school requirements, apply instructions,
   open check history, "Still open?" buttons, "Report update" button, "Save to my tracker" button,
   "Draft email for this" button.
4. **/partnership-checker**: search box that matches brand names AND legal names AND aliases against
   the HTE list (fuzzy match, e.g. pg_trgm or a simple normalized contains). Shows the HTE list version
   and date. Result wording must be careful: **"Not found in the AY 2026-2027 list" never means
   "no MOA"**, and a match on a brand name does not prove the exact legal entity or campus is covered
   (KPMG's MOA was with NU Manila only). Show next steps: ask FIC, use the AILPO MOA request form,
   check the MOA board, and ask the employer early: "Do you require an existing MOA with our specific
   campus, or can you accommodate a new school partnership?"
5. **/moa-board**: companies where someone requested a new MOA, status, date, how many classmates need it.
6. **/cold-emails**: companies with a published direct email even without a post, showing contact status
   (reply received vs untested). Copy button only for usable ones. A "Do not use" section lists bounced
   and help-desk-only addresses so nobody wastes an email on them.
7. **/me/tracker** (login): kanban on desktop, grouped list on mobile. Status pipeline
   Saved > Applied > Assessment > Interview > Offered > Accepted, plus Declined, Rejected, Withdrawn, Closed.
   Highlight follow-ups due today. Manual entries allowed for companies not in the directory.
8. **/me/checklist** (login): AILPO deployment docs checklist (items in `03_OJT_CONTEXT_AND_LESSONS.md`),
   with a "Can do now" filter.
9. **/me/profile** (login): fields used by templates.
10. **/templates**: pick a template + an opportunity, preview filled text, edit inline, copy subject and
    body separately. Templates (all plain, short, polite, no em dashes):
    - Application email (with resume attached reminder)
    - Cold email (no post)
    - Questions email (allowance, hours, Nov start, MOA) for HTE partners
    - MOA / partnership readiness note for non-partners (asks if an existing campus MOA is required)
    - Reply to "Can you extend to 800 hours?" (uses profile max_hours, asks schedule and whether the
      allowance covers all hours)
    - Follow-up after 1 to 2 weeks (same thread)
    - Resume attachment correction ("Sorry, I forgot to attach my resume")
    - Interview thank you
    - Polite decline (e.g. unpaid offer)
    - Short cover letter for JobStreet / LinkedIn text boxes
    Structure for application emails and cover letters: (1) role, company, where you saw it, and your
    required hours + start date; (2) one or two concrete projects that match the role; (3) why the work
    interests you and what you can contribute; (4) short questions only for unknown essentials (hours,
    intake, setup, allowance, exact-campus MOA); (5) resume attached, portfolio link, short closing.
    Rules: use only what the user entered in their profile, never invent skills or school approvals,
    don't stuff every project into every letter, follow the employer's subject line format if set on the
    opportunity (e.g. `Facebook: [Position] Intern_[Full Name]`). Show a pre-send checklist under every
    draft: correct company and role name, resume attached, subject format, sending to a usable contact.
10b. **/form-tips**: short static page of truthful answers for common application form questions:
    no prior internship means select none (academic projects are not internships), enrolled is not a
    completed degree, only tick tools and proficiencies you actually have, LECPA is N/A for BSIT,
    "other applications" means real stages only, and always review JobStreet quick apply cover letters
    because they may still name a previous company.
11. **/submit** (login): add new opportunity or report an update with evidence (URL or note).
    Personal HR replies must be summarized, no names or personal numbers.
12. **/admin** (admin only): review queue with diff view (current vs proposed), approve/reject,
    CSV import for opportunities and the HTE list, edit partnership status.

## 7. Business rules

- Allowance per day estimate: per month / 22, per hour * 8. Always label it "est.". Never copy an
  allowance from a different role at the same company (Global Transco's PHP 150/day was for other roles).
- Keep these states distinct everywhere: unknown, confirmed, reported, historical, closed. A post that
  still loads is not proof the position is open.
- General employee perks and company reviews are not intern benefits. Show review source, date and
  sample size; label employer testimonials as "from the company".
- Remote opportunities can be stored (some friends may come from other schools later) but are hidden by
  default and labeled not allowed for NU Laguna.
- "Not disclosed" is its own filter option and never sorts as zero.
- Partnership badge colors: listed in HTE = green, confirmed = green with check, MOA requested = amber,
  needs clarification = amber, not listed = grey (not red). Always show source on hover/tap.
- Post status auto-hints: if `last_checked_at` is older than 14 days, show "needs re-check".
  Two "link_dead" or "opened_but_closed" checks from different users flags it for admin review.
  Never auto-close without admin.
- Do not scrape job sites. Job pages often block bots and cached copies lie (see lessons file).
- Every important field (allowance, hours, partnership) stores where it came from and when.
- Dates shown in Philippine time (Asia/Manila).

## 8. UI and design

- Clean, fast, mobile first. Compact cards, sticky filter button on mobile (bottom sheet),
  sidebar filters on desktop. Light and dark mode.
- Readable badges with text, not color only.
- Empty states that tell the user what to do next.
- Copy buttons with a "Copied!" toast.
- Simple, friendly microcopy for students. No corporate fluff, no em dashes.
- Accessibility: proper labels, focus states, 44px tap targets.
- Lighthouse 90+ on mobile for the directory page.

## 9. Build phases (one phase per session)

- **Phase 0: Setup.** Next.js + TS + Tailwind project, Supabase project, Google auth, env vars,
  deploy an empty page to Vercel. Give me the exact clicks for Supabase and Vercel dashboards.
- **Phase 1: Database.** SQL migrations for all tables, enums, RLS policies, indexes, the
  allowance per day computed column, seed script that imports `nu_laguna_hte_list_2026-27.csv`,
  `seed_internships_2026-10-22.csv` and `seed_internships_2026-10-23_handoff.csv` (map the CSV text
  fields carefully, set unknowns to unknown, set partnership from the HTE match, set `last_checked_at`
  to the file's date, when the same company appears in both files keep both facts in `fact_sources`
  and use the newer one as the current value, e.g. QNE is now confirmed unpaid). Seed
  `company_contacts` from `03_OJT_CONTEXT_AND_LESSONS.md` section 4, including the bounced ones.
  Import everything with `is_published = false` so I review before it goes public.
- **Phase 2: Directory + filters + detail pages** (public).
- **Phase 3: Partnership checker + MOA board + cold email list.**
- **Phase 4: Auth + profile + private tracker + deployment checklist.**
- **Phase 5: Templates page.**
- **Phase 6: Submissions, "Still open?" checks, admin review queue, CSV import.**
- **Phase 7: Polish.** Shareable filter links, OG image for Messenger previews, loading states,
  error pages, basic analytics (Vercel Analytics free), README for friends.

Later (not MVP): email reminders for follow-ups, AI drafting with my own API key, PDF parsing of new
HTE lists, notifications when a saved company posts again, résumé upload, live inbox integration,
automated scraping or AI research (these all have cost, data quality and privacy risks).

## 10. Definition of done for each phase

- Works on a 375px wide phone and on desktop.
- No TypeScript errors, `npm run build` passes.
- RLS tested: a logged out user cannot read another user's tracker; a normal user cannot approve submissions.
- No secrets in the repo. `.env.example` updated.
- Short test checklist I can follow by hand.

## 11. Context files

- `02_ABOUT_MERWIN.md`: who I am, my profile (use it to pre-fill MY profile row and to test templates,
  but never hard code my personal data into public pages or source code).
- `03_OJT_CONTEXT_AND_LESSONS.md`: NU Laguna process, what happened in our hunt, lessons, data notes.
- `nu_laguna_hte_list_2026-27.csv`: the 530 companies on NU Laguna's FINAL LIST OF HTEs FOR AY 2026-27.
- `seed_internships_2026-10-22.csv`: 25 checked IT internship leads near Makati (19 HTE partners,
  6 non-partners), checked Oct 22, 2026. The `fit_note` column is my personal rating, don't publish it.
- `seed_internships_2026-10-23_handoff.csv`: 20 more leads from my application history (public-safe
  fields only, no application status), with a `dev_exposure_guess` column.

Start now with Phase 0. Show me the plan first.
