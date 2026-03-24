# Requirements — Finance Summary Card Navigation (Issue #68)

## Acceptance Criteria

### REQ 1 — SummaryCard linkable
- REQ 1.1: `SummaryCard` accepts an optional `href: string` prop.
- REQ 1.2: When `href` is provided, the card renders as a `<Link>` (navigable anchor).
- REQ 1.3: When `href` is omitted, the card renders as a plain `<div>` (non-interactive).
- REQ 1.4: The interactive card must have a minimum touch target of 44×44px.
- REQ 1.5: The interactive card must be keyboard-accessible (focusable, Enter navigates).

### REQ 2 — Finance overview wired
- REQ 2.1: The Income `SummaryCard` on the finance overview page links to `/properties/[propertyId]/payments`.
- REQ 2.2: The Expense `SummaryCard` on the finance overview page links to `/properties/[propertyId]/finance/expenses`.
- REQ 2.3: The Net Income `SummaryCard` has no link (display-only).

### REQ 3 — Recent Payments list non-interactive
- REQ 3.1: Individual payment items in `RecentPaymentsList` are non-interactive (no `<Link>` or `onClick`).
- REQ 3.2: The "View Finances" link in the `RecentPaymentsList` header is preserved.
- REQ 3.3: Payment items continue to display tenant name, amount, and date.

### REQ 4 — Non-functional
- REQ 4.1: No horizontal scroll at 320px viewport width.
- REQ 4.2: WCAG AA contrast on all new interactive elements.
- REQ 4.3: No new i18n keys required (all strings already exist).
