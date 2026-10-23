# Testing

- Every phase: `npm run build` (type check + build) and `npm run lint` must pass. Both verified in P0.
- From P1: RLS checks as an anonymous user, a normal user and an admin (cross-user tracker read
  denied, normal user cannot approve submissions). Runner chosen in P1.
- UI phases: manual flow on a real phone at ~375px and on desktop; viewport emulation is labeled as such.
- Per-phase acceptance-to-test maps live in `tests/sprints/<ID>/README.md`.
