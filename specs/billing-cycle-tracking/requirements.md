# Billing Cycle Tracking — Requirements

## Context

The current payment model is purely cumulative: `outstandingBalance = monthlyRent − totalPayments (all-time)`. There is no concept of billing periods. The system cannot answer "did this tenant pay for March?" or "which months are unpaid?"

This feature introduces per-month billing cycles so landlords can see exactly which months are paid, partial, or unpaid.

## Goals

- Track which months are paid/unpaid per tenant
- When recording a payment, default to assigning it to the oldest unpaid month (FIFO), with an override option to pick a specific month
- Replace the cumulative balance view with a per-cycle unpaid breakdown
- Prevent a tenant from claiming "I paid for this month" while an earlier month is still unpaid

## Non-Goals

- Server-side pagination of billing cycles
- Automatic overdue notifications or reminders
- Multi-month payment bundles (one payment covering multiple cycles)
- Changes to rooms list, tenant list, or any non-balance/payment UI

## Glossary

| Term | Definition |
|------|-----------|
| Billing cycle | A (year, month) period for a tenant that tracks how much has been paid vs. the monthly rent |
| Cycle status | `paid` (sum ≥ rent), `partial` (0 < sum < rent), `unpaid` (sum = 0) |
| FIFO assignment | Automatically assigns a new payment to the oldest cycle that is not yet fully paid |
| Move-in month | The (year, month) of the tenant's `movedInAt` date — the first billing period |

---

## Requirements

### REQ-1 — Per-cycle timeline generation

The balance service must generate a complete list of billing cycles from the tenant's move-in month to the current month. This list is computed in memory; no DB rows are stored for months without payments.

### REQ-2 — Cycle status computation

Each cycle in the generated timeline has a status:
- `paid` — total payments linked to this cycle ≥ `monthlyRent`
- `partial` — total payments linked to this cycle > 0 but < `monthlyRent`
- `unpaid` — no payments are linked to this cycle

### REQ-3 — BalanceSection: per-cycle unpaid breakdown

The `BalanceSection` on the tenant detail page must replace the current cumulative view with a list of billing cycles that are `unpaid` or `partial`. For each unpaid/partial cycle, show: month/year label, amount owed, status badge.

If all cycles are `paid`, show the existing "Fully Paid" status.

### REQ-4 — Payment form: billing period selector

The payment recording form must include a billing period dropdown (month + year). The dropdown:
- Defaults to the oldest unpaid or partial cycle
- Lists all cycles from move-in to current month that are not fully paid (unpaid first, then partial)
- Allows the user to override to any listed cycle

### REQ-5 — BillingCycle record creation on payment

When a payment is recorded:
1. Resolve the target billing cycle (from user selection or FIFO default)
2. If no `BillingCycle` row exists for that (tenantId, year, month), create one
3. Create the `Payment` row with `billingCycleId` set to the cycle

### REQ-6 — Backward compatibility

Payments without a `billingCycleId` are treated as unassigned and excluded from per-cycle calculations. The cumulative balance view is no longer the primary display; the per-cycle breakdown replaces it.

### REQ-7 — Demo data

The demo seed data must include tenants demonstrating:
- A tenant fully paid up (all cycles `paid`)
- A tenant with 2+ consecutive unpaid months
- A tenant with a partial payment (paid less than `monthlyRent` for a month)
- A tenant who skipped a month (paid month 1 and month 3, not month 2)

### REQ-8 — Internationalisation

All new UI strings use i18n translation keys. No hardcoded English strings in component source.

### REQ-9 — Accessibility

- Billing cycle status uses icon + text (no icon-only)
- Billing period dropdown has an explicit `aria-label`
- All interactive elements have minimum touch target 44×44 px

### REQ-10 — Mobile layout

At 320 px viewport width, the per-cycle breakdown and billing period dropdown must be fully visible with no horizontal scroll.

## Definition of Done

- [ ] `BillingCycle` model added to Prisma schema (with user approval)
- [ ] `billingCycleId` optional field added to `Payment` model
- [ ] Domain schemas and repository interfaces updated
- [ ] `BillingCycleRepository` (Prisma) implemented
- [ ] `balance-service` updated to return per-cycle breakdown
- [ ] `payment-service.createPayment` assigns payments to billing cycles
- [ ] Balance API route returns per-cycle data
- [ ] `BalanceSection` shows per-cycle unpaid breakdown
- [ ] Payment form includes billing period dropdown
- [ ] Demo seed data updated with all 4 scenarios
- [ ] i18n keys added to `locales/en.json` and `locales/id.json`
- [ ] All Vitest tests pass
- [ ] All E2E tests pass in CI
