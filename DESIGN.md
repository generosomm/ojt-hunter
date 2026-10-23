# OJT Hunter: Design

Status: **owner brief set 2026-10-23; tokens and components defined at the start of P2** using the
`frontend-design` skill for app screens. One direction for the whole project.

## Owner brief (2026-10-23)
- Creative minimalist. Very little text on every screen: one headline, short labels, details on tap.
- Subtle 3D and depth, used sparingly (one signature element per page, not on every card).
- Minimal "liquid glass" in the macOS style: translucent surfaces, soft blur, gentle highlights.
  Keep text contrast measurable; glass never sits behind long text.
- Use maintained component sources instead of hand-built widgets (Lucide icons, shadcn-style
  primitives, Sonner toasts, Motion for transitions), restyled to the project tokens.
- Nothing hardcoded: every listing, label list and number comes from the database or `app_config`.

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
