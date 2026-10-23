# Testing

- Every phase: `npm run build` (type check + build), `npm run lint` and `npm test` must pass.
- From P1: RLS checks as an anonymous user, a normal user and an admin (cross-user tracker read
  denied, normal user cannot approve submissions). Runner chosen in P1.
- UI phases: manual flow on a real phone at ~375px and on desktop; viewport emulation is labeled as such.
- Per-phase acceptance-to-test maps live in `tests/sprints/<ID>/README.md`.
