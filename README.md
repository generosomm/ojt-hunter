# OJT Hunter

**https://ojthunter.vercel.app**

Find an OJT faster: real pay, NU Laguna HTE status, setup, hours and where to apply, in one place.
Made by a BSIT student for classmates who still need a company.

## For students

You can browse without signing in. Sign in with Google to save things for yourself.

| Tab | What it does |
|---|---|
| **Roles** | Every reviewed lead. Filter by pay per day, HTE partner, fits your hours, Nov start, city and setup. Copy the link to share a filtered list in Messenger. |
| **HTE** | Type a brand or legal name to check the NU Laguna HTE list. "Not found" does not mean there is no MOA. Ask your FIC. |
| **MOA** | New partnerships classmates asked for. Tap "I need this too" so the FIC sees the demand. |
| **Emails** | HR addresses companies published, plus a "Do not use" list of bounced ones. |
| **Me** | Your private tracker, AILPO checklist, email templates and profile. Only you can see them. |

Good habits:
- **Pay shown as "/day est."** is converted from monthly or hourly pay (22 days, 8 hours). "Not disclosed" is not "unpaid".
- **Remote roles** are hidden by default because fully remote OJT is not allowed for NU Laguna.
- **Opened a post?** Tap Still open, Closed or Link dead on the role page. Two classmates saying it's closed sends it for review.
- **Know something new?** Use "Share an update" at the top (pay confirmed, post closed, bounced email, new role). An admin checks it first.
- **Filling an application form?** Read [Form tips](https://ojthunter.vercel.app/form-tips) first (prior internship, degree, tools, LECPA).
- **Templates** fill from your profile. Anything the app doesn't know shows as [brackets]. Replace them, attach your resume, then send.

Data is checked by students and can go out of date. Always confirm with the company and your FIC.

## For developers

Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind, Supabase (Postgres, Google sign-in, Row Level Security), hosted on Vercel.

```bash
cp .env.example .env.local   # add the Supabase URL and publishable key
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run lint && npm test
```

- Product and rules: [PRODUCT.md](PRODUCT.md) and the full spec in [docs/spec.md](docs/spec.md)
- Stack, folders, public-repo rules, column grants: [PROJECT.md](PROJECT.md)
- Design tokens and direction: [DESIGN.md](DESIGN.md)
- Phases, status and decisions: [docs/sprint-plan.md](docs/sprint-plan.md); database tests in `tests/sprints/`

This repo is public. Read the "Public repo rules" in PROJECT.md before committing.
