# Design — Finance Summary Card Navigation (Issue #68)

## Component Changes

### `src/components/finance/summary-card.tsx`
- Add `href?: string` to `SummaryCardProps`
- When `href` is provided: wrap entire card content in `<Link href={href}>` with `className="block min-h-[44px]"`
- When `href` is absent: render existing `<Card>` as-is
- No visual change to card content; link affordance comes from the card being interactive

### `src/app/(app)/properties/[propertyId]/finance/page.tsx`
- Pass `href={`/properties/${propertyId}/payments`}` to Income `SummaryCard`
- Pass `href={`/properties/${propertyId}/finance/expenses`}` to Expense `SummaryCard`
- Net Income card: no `href` (unchanged)

### `src/components/dashboard/RecentPaymentsList.tsx`
- Replace `<Link>` wrapping each `<li>` payment item with a plain `<div>`
- Keep the "View Finances" `<Link>` in the `CardHeader`
- Preserve layout and data display

## No Changes Needed
- No new API routes
- No schema changes
- No new i18n keys
- No new pages

## Touch Target Compliance
- `SummaryCard` link wrapper: `min-h-[44px] block` ensures tappability
- Existing payment item layout already ≥ 44px height via `p-2` and text content
