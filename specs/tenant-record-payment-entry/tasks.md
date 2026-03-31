# Tasks — Tenant Record Payment Entry (issue #88)

## UI Layer
- [x] `TenantPaymentSection`: add `isMovedOut` prop; add "Record Payment" link-button in header row
- [x] `PaymentForm`: add `defaultTenantId` prop; wire to `defaultValues`
- [x] `NewPaymentPage`: read `tenantId` from `useSearchParams`; pass to `PaymentForm`
- [x] Tenant detail page: pass `isMovedOut` to `TenantPaymentSection`

## Tests
- [x] Unit: `TenantPaymentSection` — button renders/hides correctly
- [x] Unit: `PaymentForm` — defaultTenantId pre-selects tenant
- [x] E2E: click "Record Payment" from tenant detail → payment form has tenant pre-selected
