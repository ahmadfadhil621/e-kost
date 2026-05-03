# Tasks — Finance: Export Payments Register to XLSX (Issue #121)

## Layer 1: Domain
- [ ] Add `paymentFilterSchema` and `PaymentFilters` type to `src/domain/schemas/payment.ts`
- [ ] Add `PaymentExportRow` interface to `src/domain/schemas/payment.ts`
- [ ] Add `findForExport(propertyId, filters)` to `src/domain/interfaces/payment-repository.ts`
- [ ] Update `findByProperty` signature in `src/domain/interfaces/payment-repository.ts` to accept optional `PaymentFilters`

## Layer 2: Repository
- [ ] Implement `findForExport` in `src/lib/repositories/prisma/prisma-payment-repository.ts`
  - Join: tenant, billing_cycle, room_assignment (room active at paymentDate)
  - Filter: dateFrom / dateTo
  - Fetch up to 10,001 rows for cap detection
- [ ] Update `findByProperty` in prisma repository to apply optional date filters

## Layer 3: Service
- [ ] Install `exceljs` package
- [ ] Add `ExportRowCapError` class to `src/lib/payment-service.ts`
- [ ] Add `exportPayments(userId, propertyId, filters, userTimezone, userLocale)` to `PaymentService`
  - Validates access, fetches rows, checks cap, builds XLSX buffer, returns buffer + filename
- [ ] Update `listPayments` to accept and pass through optional `PaymentFilters`
- [ ] Update stub repository (`src/lib/repositories/stub-payment-repository.ts`) with new method stubs

## Layer 4: API
- [ ] Create `src/app/api/properties/[propertyId]/payments/export/route.ts`
  - GET handler: auth, parse filters, fetch user timezone + language, call exportPayments, stream XLSX
- [ ] Update `src/app/api/properties/[propertyId]/payments/route.ts` GET handler to parse and pass date filters

## Layer 5: UI
- [ ] Add export button to `src/app/(app)/properties/[propertyId]/payments/page.tsx`
  - Download icon (lucide-react), disabled with tooltip when 0 payments

## Layer 6: i18n
- [ ] Add `payment.export.*` keys to `locales/en.json`
- [ ] Add `payment.export.*` keys to `locales/id.json`

## Tests
- [ ] Vitest unit/integration tests (payment-service + API route)
- [ ] E2E Playwright test (download flow)
- [ ] All three quality gates pass

## Regression
- [ ] `npm run test:run` passes with 0 failures
- [ ] `npm run lint` passes with 0 errors
