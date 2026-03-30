# Finance Inline Cards — Design

Issue: #86

## API Routes

### New: DELETE /api/properties/[propertyId]/payments/[paymentId]

```
DELETE /api/properties/:propertyId/payments/:paymentId
Authorization: session required, property access required

200 → 204 No Content (on success)
404 → { error: "Payment not found" } (payment doesn't exist or belongs to another property)
403 → { error: "Forbidden" } (no session or no property access)
```

No schema changes. Balance recalculates on-demand (sums existing payments).

## Domain Changes

### IPaymentRepository (src/domain/interfaces/payment-repository.ts)

Add method:
```typescript
delete(id: string): Promise<void>
```

### PaymentService (src/lib/payment-service.ts)

Add method:
```typescript
deletePayment(userId: string, propertyId: string, paymentId: string): Promise<void>
```

Logic:
1. Validate property access via `propertyAccess.validateAccess(userId, propertyId)`
2. Fetch payment via `paymentRepo.findById(paymentId)`
3. Fetch tenant via `tenantRepo.findById(payment.tenantId)` — verify tenant.propertyId === propertyId
4. Call `paymentRepo.delete(paymentId)`

## UI Components

### Modified: src/app/(app)/properties/[propertyId]/finance/expenses/page.tsx

- Remove `<a>` wrapper from expense cards
- Remove `hover:bg-muted/50` class
- Remove `max-w-md mx-auto` constraint at list level (align with payment page)
- Add Edit button → navigates to `expenses/${expense.id}/edit`
- Add Delete button → opens confirmation dialog
- Add delete mutation with cache invalidation on `["expenses", propertyId]`
- Confirmation dialog: "Delete Expense?" + description + Cancel/Delete buttons

### Deleted: src/app/(app)/properties/[propertyId]/finance/expenses/[expenseId]/page.tsx

File removed entirely. No redirect.

### Modified: src/components/payment/payment-list.tsx

- Add `onDeletePayment?: (paymentId: string) => void` prop
- Add Delete button at bottom of each card (visible when `onDeletePayment` provided or always)
- Approach: keep delete concern in the page, pass `onDeletePayment` callback

**Alternative (simpler):** inline delete mutation directly in `PaymentList` component with `propertyId` prop.
Decision: accept `propertyId` prop and own the delete mutation internally, to avoid prop-drilling the mutation state.

### Modified: src/app/(app)/properties/[propertyId]/payments/page.tsx

- Pass `propertyId` to `PaymentList` (for delete mutation)

### Modified: src/app/(app)/properties/[propertyId]/finance/cashflow/page.tsx

Current card structure (horizontal flex):
```tsx
<Card>
  <CardContent className="flex ...">
    <div>{description} <span>{date}</span></div>
    <span className="text-green|red">{+/−}{amount}</span>
  </CardContent>
</Card>
```

New card structure (vertical CardHeader + CardContent):
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-green|red font-semibold tabular-nums">
      {+/−}{formatCurrency(amount)}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p>{description || t("cashflow.noDescription")}</p>
    <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
  </CardContent>
</Card>
```

## i18n Keys

New keys needed in `locales/en.json` and `locales/id.json`:

```
payment.delete.button         = "Delete"                / "Hapus"
payment.delete.title          = "Delete Payment?"       / "Hapus Pembayaran?"
payment.delete.description    = "This action cannot be undone. The payment record will be permanently removed."
                                / "Tindakan ini tidak dapat dibatalkan. Catatan pembayaran akan dihapus permanen."
payment.delete.confirm        = "Delete"                / "Hapus"
```

Expense delete keys (check if already present from detail page):
```
expense.delete.button         = "Delete"                / "Hapus"
expense.delete.title          = "Delete Expense?"       / "Hapus Pengeluaran?"
expense.delete.description    = ...
expense.delete.confirm        = "Delete"                / "Hapus"
```

## Correctness Properties

- PROP-1: A deleted payment's amount is not included in balance calculations (balance is derived from `SUM(payments)`)
- PROP-2: `deletePayment` rejects if payment.tenantId's property doesn't match the requested propertyId
- PROP-3: Expense cards are not `<a>` elements after this change — no accidental navigation
- PROP-4: All currency amounts across the three pages use `tabular-nums`
- PROP-5: Delete always requires explicit confirmation — no single-click destroy

## Files Affected

### New
- `src/app/api/properties/[propertyId]/payments/[paymentId]/route.ts`
- `src/app/api/properties/[propertyId]/payments/[paymentId]/route.test.ts`
- `e2e/finance-expense-tracking/delete-expense.spec.ts`
- `e2e/payment-recording/delete-payment.spec.ts`

### Modified
- `src/domain/interfaces/payment-repository.ts`
- `src/lib/repositories/prisma/prisma-payment-repository.ts`
- `src/lib/payment-service.ts`
- `src/lib/payment-service.test.ts` (add deletePayment tests + `delete` in mock factory)
- `src/lib/payment-service.fault-injection.test.ts` (add `delete` to mock repo)
- `src/app/(app)/properties/[propertyId]/finance/expenses/page.tsx`
- `src/app/(app)/properties/[propertyId]/finance/cashflow/page.tsx`
- `src/components/payment/payment-list.tsx`
- `src/app/(app)/properties/[propertyId]/payments/page.tsx`
- `locales/en.json`
- `locales/id.json`
- `e2e/helpers/finance-expense-tracking.ts` (remove `goToExpenseDetail`)

### Deleted
- `src/app/(app)/properties/[propertyId]/finance/expenses/[expenseId]/page.tsx`
- `e2e/finance-expense-tracking/view-expense-detail.spec.ts`
