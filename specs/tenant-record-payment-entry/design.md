# Design — Tenant Record Payment Entry (issue #88)

## Components changed

### `TenantPaymentSection` (`src/components/payment/tenant-payment-section.tsx`)
- Add `isMovedOut?: boolean` prop (default `false`).
- Render a `<Link>` button in the section header row (flex row: title left, button right) when `!isMovedOut`.
- Link href: `/properties/${propertyId}/payments/new?tenantId=${tenantId}`
- Classes: `min-h-[44px] min-w-[44px]`, uses `Button` with `asChild` + `size="sm"` + `variant="outline"`.
- i18n key: `payment.list.recordPayment`.

### `PaymentForm` (`src/components/payment/payment-form.tsx`)
- Add `defaultTenantId?: string` prop.
- Pass it as `defaultValues.tenantId` in `useForm`.

### `NewPaymentPage` (`src/app/(app)/properties/[propertyId]/payments/new/page.tsx`)
- Read `searchParams.tenantId` (Next.js `useSearchParams`).
- Pass `defaultTenantId` to `<PaymentForm>`.

### Tenant Detail Page (`src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx`)
- Pass `isMovedOut={!!tenant.movedOutAt}` to `<TenantPaymentSection>`.
  (The moved-out branch already skips rendering TenantPaymentSection, so this is belt-and-suspenders.)

## i18n
No new keys. Existing key `payment.list.recordPayment` = "Record Payment" (en) / existing ID translation.
