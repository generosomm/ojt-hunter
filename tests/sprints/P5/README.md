# P5 tests

| Acceptance | Check | Status |
|---|---|---|
| Fill engine (markers, optional lines, em dashes, questions, subject format, two projects) | `npm test` (`fill.test.ts`, Node 24 runs TS directly) | passed 2026-10-23 (7/7; the "Intern Intern" case was found in a render and added as a test before the fix) |
| Signed-out render | `/templates?t=application&role=global-transco-dev-qa-intern`: markers, 5 questions, careers@ address to copy, employer subject, no em dashes | passed 2026-10-23 (local HTML) |
| Build | `npm run build`, `tsc`, `lint` | passed 2026-10-23 |
| Signed-in fill | Owner drafts an application for a real role: own name, hours, dates, two projects, no brackets except [your reason] style ones | pending (owner) |
