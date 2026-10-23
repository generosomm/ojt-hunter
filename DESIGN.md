# OJT Hunter: Design

Status: **direction pending**. Chosen at the start of Phase 2 (directory screens), using the
`frontend-design` skill for app screens. One direction for the whole project.

## Fixed constraints (from spec section 8)
- Mobile first, 375px phones opened from Messenger. Compact cards; sticky filter button that opens a
  bottom sheet on mobile, sidebar filters on desktop.
- Light and dark mode. Owner's taste: dark, sleek, smooth motion (like generosomm.dev), but it must
  stay fast and readable.
- Badges carry text, not color only. Partnership: listed/confirmed = green, MOA requested or needs
  clarification = amber, not listed = grey (never red). Source shown on hover/tap.
- Empty states say what to do next. Copy buttons show a "Copied!" toast.
- Labels, visible focus, 44px tap targets, reduced-motion support.
- Friendly student microcopy, no corporate fluff, no em dashes.
- Target: Lighthouse 90+ on mobile for the directory page (measured, not assumed).
