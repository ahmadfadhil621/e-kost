# Requirements — Customisable Billing Day per Tenant

## Source
GitHub Issue #101

## Problem
Billing cycles currently use calendar-month boundaries (1st–last). There is no per-tenant due date. `movedInAt` day is ignored for cycle generation.

## Goals
- Store a `billingDayOfMonth` (1–31) per tenant
- Default to `day(movedInAt)` when a tenant is assigned to a room
- Owner/staff can override it in the Assign Room dialog and Edit Tenant form
- Cycle engine generates cycles anchored to this day (e.g. day 15 → Jan 15–Feb 14 = "January" cycle)
- Balance section shows the due date using `billingDayOfMonth`

## Non-Goals
- Does not change the Payment model
- Does not retroactively re-create billing_cycle records

## Constraints
- `billingDayOfMonth` is 1–31; when generating a cycle boundary for a specific month, clamp to that month's actual last day (e.g. day 31 in February → Feb 28/29)
- Must not break existing tenants who have NULL billingDayOfMonth (fall back to `day(movedInAt)`, then 1)
- Schema change must be applied in Supabase before `prisma db pull`

## Decisions
- Label for a cycle is the **start month** (e.g. Jan 15–Feb 14 → "January 2026")
- `billingDayOfMonth` is stored as nullable `Int` in DB; domain treats null as "use day of movedInAt"
