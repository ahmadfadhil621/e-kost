# Tasks — Finance Summary Card Navigation (Issue #68)

## Layer: UI Components

- [ ] Update `SummaryCard` to accept optional `href` prop and render as `<Link>` when provided
- [ ] Wire Income and Expense cards on finance overview page to their target routes
- [ ] Remove `<Link>` from individual payment items in `RecentPaymentsList`

## Layer: Tests

- [ ] Update unit tests for `SummaryCard` (href cases)
- [ ] Update unit tests for `RecentPaymentsList` (non-interactive items)
- [ ] Write E2E spec: `finance-summary-card-navigation.spec.ts`

## Regression

- [ ] `npm run test:run` passes with 0 failures
- [ ] `npm run lint` passes with 0 errors
