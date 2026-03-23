# G-1 — Responsive Layout: Design

## Decision: Centered Column

### Option A: Centered column (chosen)
Scale up the existing `max-w-[480px] mx-auto` pattern on `<main>` by adding `md:max-w-2xl lg:max-w-3xl`. Apply the same constraint to the header inner div and the nav items wrapper so all content rows visually align at every viewport.

### Option B: Sidebar navigation
On `md+`, replace the bottom nav with a fixed left sidebar. Substantially more work, requires restructuring the layout shell, and would break existing E2E nav tests. Not implied by the issue text.

**Rationale for Option A:** The issue explicitly says "constrain max-width and center content on desktop." The current `<main>` already uses this pattern. Extending it consistently to header and nav is the minimal correct change.

---

## Shared Max-Width Scale

All three layout shell components use the same three-step scale:

| Breakpoint | Class | Width |
|------------|-------|-------|
| Default (mobile) | `max-w-[480px]` | 480px |
| `md:` (768px+) | `md:max-w-2xl` | 672px |
| `lg:` (1024px+) | `lg:max-w-3xl` | 768px |

The three files that must stay in sync: `layout.tsx` (main), `app-header.tsx` (inner wrapper), `app-nav.tsx` (inner wrapper).

**Duplication tradeoff:** The value appears in three places. A shared CSS custom property or Tailwind token would be cleaner long-term but adds complexity for a three-file change. We accept the duplication and note the sync requirement in a comment in each file. (Future: extract to a `cn()` utility constant if the pattern spreads further.)

---

## Component Changes

### `src/app/(app)/layout.tsx`
- `<main className>`: add `md:max-w-2xl lg:max-w-3xl` after `max-w-[480px]`
- One-line change; no structural change to the component

### `src/components/layout/app-header.tsx`
- Introduce one new `<div>` wrapping both inner rows (main row + occupancy stats row)
- This wrapper gets the shared max-width constraint and `px-4` (moved from individual rows)
- The `<header>` itself stays full-width (border-bottom spans viewport)

### `src/components/layout/app-nav.tsx`
- Introduce one new `<div>` wrapping the `navItems.map(...)` output
- This wrapper gets the shared max-width constraint and the `gap-2 px-2` classes
- The `<nav>` itself stays `fixed bottom-0 left-0 right-0` (border-top spans viewport)

---

## Out of Scope

- Page-level `max-w-md mx-auto` on finance/settings pages — acceptable narrower columns; separate polish pass
- Auth layout — already centers its own cards
- `maximumScale: 1` viewport meta — unchanged (mobile zoom prevention, unrelated to this feature)
