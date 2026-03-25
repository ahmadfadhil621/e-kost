# RT-3 — Edit Button Placement: Requirements

Issue: #14

## Context

The Edit button on both the room detail page and tenant detail page is too large and visually detached from the content it applies to. It renders as a full-size standalone button in a separate action section.

## Acceptance Criteria

### RT-3.1 — Room detail: Edit button inline with header
- The Edit button on the room detail page MUST appear inline with the page heading (`h2`), positioned to the right of the heading text.
- The Edit button MUST NOT render as a separate, full-width standalone action button.
- The Edit button MUST NOT appear when the room is archived.

### RT-3.2 — Tenant detail: Edit button inline with header
- The Edit button on the tenant detail page MUST appear inline with the page heading (`h2`), positioned to the right of the heading text.
- The Edit button MUST NOT render as a separate, full-width standalone action button.
- The Edit button MUST NOT appear for moved-out tenants.

### RT-3.3 — Touch target
- Both Edit buttons MUST maintain a minimum touch target of 44×44px (via `min-h-[44px] min-w-[44px]`), regardless of visual size.

### RT-3.4 — Mobile viewport
- Both pages MUST render without horizontal scroll at 320px–480px viewport widths with the Edit button inline.

### RT-3.5 — Accessibility
- Both Edit buttons MUST be keyboard-navigable (focusable, activatable via Enter/Space).
- Both Edit buttons MUST have a descriptive accessible name (at minimum "Edit").
- Any decorative icon MUST be `aria-hidden`.
- Visual appearance MUST meet WCAG AA contrast (using existing design token colors — no custom colors).

### RT-3.6 — Navigation preserved
- Clicking the Edit button on room detail navigates to `/properties/{propertyId}/rooms/{roomId}/edit`.
- Clicking the Edit button on tenant detail navigates to `/properties/{propertyId}/tenants/{tenantId}/edit`.
