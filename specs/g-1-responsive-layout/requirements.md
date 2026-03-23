# G-1 — Responsive Layout: Requirements

## Issue
GitHub Issue #3 — "G-1 — Responsive layout: scale up gracefully on desktop"

## Problem
The app is mobile-first. All pages cap their content at ~480px and sit in a narrow column on wider viewports, while the header and bottom nav chrome span the full viewport width. This creates a visually unbalanced layout on desktop and wastes horizontal space.

## Goal
Make the layout scale gracefully from 320px up to 1440px+, without breaking the mobile baseline.

## Scope
- Every page — change is applied at the global layout shell level
- Affected components: `AppHeader`, `AppNav`, and the `<main>` wrapper in the app layout
- Auth pages (login, register) are already desktop-safe and excluded

## Constraints
- **Must not break the 320–480px mobile baseline** — all existing behaviour preserved
- **No sidebar redesign** — keep bottom nav; scale content column only
- **No API, domain, or service changes** — UI-only
- **No `playwright.config.ts` changes** — use per-test viewport overrides for desktop E2E tests
- **No `tailwind.config.ts` changes** — use standard Tailwind breakpoint utilities

## Requirements

### REQ-1 — Mobile baseline preserved

At viewport widths below 768px, the layout must be unchanged from the pre-change baseline: bottom nav fixed at the bottom, main content capped at 480px width and horizontally centered.

### REQ-2 — Main content scale-up on tablet and desktop

At 768px+ (md breakpoint), the `<main>` element must expand beyond the 480px mobile cap. At 1024px+ (lg breakpoint) it expands further. Content must remain horizontally centered at all sizes.

### REQ-3 — Header inner content alignment

The header inner content (PropertySwitcher + ProfileDropdown) must be constrained to the same max-width column as `<main>` so the two rows visually align on wider viewports. The header `<header>` element itself remains full-width so its bottom border spans the viewport.

### REQ-4 — Nav inner content alignment

The bottom nav items must be constrained to the same max-width column as `<main>`. The `<nav>` element itself remains full-width so its top border spans the viewport.

### REQ-5 — No horizontal scroll

There must be no horizontal scrollbar or overflow at any tested viewport (375px, 768px, 1280px).

### REQ-6 — Auth layout unchanged

Login and registration pages are already desktop-safe (centered cards) and must not be modified.

## Acceptance Criteria
- [ ] At 375px, layout is pixel-identical to pre-change (bottom nav, 480px content cap)
- [ ] At 768px+, main content column is wider than 480px and centred
- [ ] At 1280px+, header chrome and nav chrome visually align with the content column
- [ ] Bottom nav border-top spans full viewport width at all breakpoints
- [ ] No horizontal scroll at any tested viewport
- [ ] All Vitest tests pass
- [ ] New E2E responsive tests pass locally
- [ ] Existing `e2e/navigation/bottom-nav.spec.ts` remains green
