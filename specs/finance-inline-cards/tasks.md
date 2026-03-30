# Finance Inline Cards — Tasks

Issue: #86

## Layer 1: Domain
- [ ] Add `delete(id: string): Promise<void>` to `IPaymentRepository`

## Layer 2: Repository
- [ ] Implement `delete` in `PrismaPaymentRepository`

## Layer 3: Service
- [ ] Add `deletePayment(userId, propertyId, paymentId)` to `PaymentService`

## Layer 4: API
- [ ] Create `src/app/api/properties/[propertyId]/payments/[paymentId]/route.ts` with DELETE handler

## Layer 5: UI
- [ ] Update expense list page: remove link wrapper, add inline Edit + Delete with confirmation dialog
- [ ] Delete expense detail page (`expenses/[expenseId]/page.tsx`)
- [ ] Update `PaymentList` component: add Delete button with confirmation dialog
- [ ] Update cashflow page: restructure to `CardHeader + CardContent` vertical stack
- [ ] Apply `tabular-nums` consistently across all three list pages

## Layer 6: i18n
- [ ] Add payment delete translation keys to `locales/en.json` and `locales/id.json`
- [ ] Verify expense delete keys exist (from prior detail page); add if missing

## Tests (write before implementation)
- [ ] Add `deletePayment` describe block to `src/lib/payment-service.test.ts`
- [ ] Add `delete` method to `createMockPaymentRepo` factory in payment service tests
- [ ] Create `src/app/api/properties/[propertyId]/payments/[paymentId]/route.test.ts`
- [ ] Create `e2e/finance-expense-tracking/delete-expense.spec.ts`
- [ ] Create `e2e/payment-recording/delete-payment.spec.ts`
- [ ] Delete `e2e/finance-expense-tracking/view-expense-detail.spec.ts`
- [ ] Remove `goToExpenseDetail` from `e2e/helpers/finance-expense-tracking.ts`

## Regression
- [ ] `npm run test:run` — 0 failures
- [ ] `npm run lint` — 0 errors
- [ ] Run new E2E specs locally before proposing commit
