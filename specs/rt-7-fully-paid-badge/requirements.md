# RT-7 — Fully Paid Badge on Tenant Detail

## Source
GitHub Issue #15

## Problem
The tenant detail page has no balance status visible when a tenant is fully paid.
The amber `RentMissingBanner` hides itself when `status === "paid"`, leaving no
indication of the tenant's payment state on the detail page. The tenant list page
already shows `BalanceStatusIndicator` (paid/unpaid badge) per tenant, but the
detail page does not.

## Requirements

### REQ-1 — Balance section visible on tenant detail page
The tenant detail page MUST render `BalanceSection` for active (non-moved-out) tenants
who have a room assigned.

### REQ-2 — Paid status shown with icon + text
When `status === "paid"`, the section MUST show a green `CheckCircle` icon alongside
the text "Paid". Icon-only is not acceptable (accessibility).

### REQ-3 — Unpaid status shown with icon + text
When `status === "unpaid"`, the section MUST show a red `AlertCircle` icon alongside
the text "Unpaid". Icon-only is not acceptable.

### REQ-4 — Icon consistency
The icons used MUST match those already used in `BalanceStatusIndicator`:
- `CheckCircle` for paid
- `AlertCircle` for unpaid
No new icon choices introduced.

### REQ-5 — No room assigned state handled
When a tenant has no room, `BalanceSection` MUST show the "No room assigned —
balance not available" message instead of crashing.

### REQ-6 — No new i18n keys
All displayed strings already exist in `locales/en.json` and `locales/id.json`.
No additions required.

## Out of Scope
- Billing cycle / per-month tracking (tracked in issue #92)
- Changes to balance calculation logic
- Changes to `RentMissingBanner` (remains as-is)
