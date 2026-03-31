# Requirements — Tenant Record Payment Entry (issue #88)

## Acceptance Criteria

1. **Button presence** — A "Record Payment" button appears in the `TenantPaymentSection` header row (next to "Payment History" title) for active tenants.
2. **Button absence** — The button does NOT appear for moved-out tenants.
3. **Navigation** — Clicking the button navigates to `/properties/[propertyId]/payments/new?tenantId=[tenantId]`.
4. **Pre-fill** — On the payment form page, the tenant dropdown is pre-selected with the tenant from the `tenantId` query param.
5. **Touch target** — Button meets 44×44px minimum touch target.
6. **Accessibility** — Button is keyboard-accessible, has visible label (text), WCAG AA contrast.
7. **i18n** — Uses existing `payment.list.recordPayment` key; no new strings needed.
8. **Mobile** — 320–480px viewport: no horizontal scroll, button does not overflow.
