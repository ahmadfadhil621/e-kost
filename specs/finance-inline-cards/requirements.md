# Finance Inline Cards — Requirements

Issue: #86 — UX: Inline all details on expense, payment, and cashflow list cards

## Acceptance Criteria

### Expense List
- AC-EL-1: Each expense card shows category, amount, date, and description (if present) inline — no navigation to a detail page
- AC-EL-2: Each expense card has always-visible Edit and Delete buttons at the bottom of the card
- AC-EL-3: Clicking Edit navigates to `/properties/:propertyId/finance/expenses/:expenseId/edit`
- AC-EL-4: Clicking Delete opens a confirmation dialog; confirming removes the expense and stays on the list
- AC-EL-5: Cancelling the confirmation dialog leaves the expense unchanged
- AC-EL-6: Expense cards are not clickable links (no `hover:bg-muted/50`, no `<a>` wrapper)
- AC-EL-7: No horizontal scroll at 320px–480px viewport widths
- AC-EL-8: Edit and Delete buttons have minimum 44×44px touch targets

### Expense Detail Page
- AC-ED-1: The expense detail page (`expenses/[expenseId]/page.tsx`) is removed
- AC-ED-2: No orphaned routes — navigating to `/expenses/:id` returns 404

### Payment List
- AC-PL-1: Each payment card shows tenant name, amount, payment date, and recorded date inline
- AC-PL-2: Each payment card has an always-visible Delete button at the bottom
- AC-PL-3: Clicking Delete opens a confirmation dialog; confirming removes the payment and stays on the list
- AC-PL-4: Cancelling the confirmation dialog leaves the payment unchanged
- AC-PL-5: Payments are not editable (delete and re-record is the correction flow)
- AC-PL-6: Delete button has minimum 44×44px touch target
- AC-PL-7: No horizontal scroll at 320px–480px viewport widths

### Payment DELETE API
- AC-API-1: `DELETE /api/properties/:propertyId/payments/:paymentId` returns 204 on success
- AC-API-2: Returns 404 when payment not found
- AC-API-3: Returns 403 when user lacks property access
- AC-API-4: Payment must belong to the specified property

### Cashflow List
- AC-CF-1: Each cashflow entry uses `CardHeader + CardContent` vertical stack (not horizontal flex)
- AC-CF-2: Amount displayed in CardHeader (prominent position, color-coded: green for income, red for expense)
- AC-CF-3: Description and date displayed in CardContent
- AC-CF-4: `+`/`−` prefix retained on amounts (income/expense indicator)
- AC-CF-5: No actions needed — cashflow entries are read-only
- AC-CF-6: No horizontal scroll at 320px–480px viewport widths

### Visual Consistency
- AC-VC-1: All three lists use `CardHeader + CardContent` vertical stack
- AC-VC-2: Consistent card width behavior across all three lists (no `max-w-md mx-auto` difference)
- AC-VC-3: `tabular-nums` applied to all currency amounts in all three lists
- AC-VC-4: No hover styling on non-interactive cards (expense and cashflow)
