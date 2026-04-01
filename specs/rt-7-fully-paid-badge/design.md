# RT-7 — Design

## Approach
Add `BalanceSection` to the tenant detail page. The component already exists,
is fully tested, and renders the correct paid/unpaid badge with icon + text.

## Placement (detail page render order)
1. Header (title + Edit button)
2. Tenant info (name, phone, email, room)
3. **`<BalanceSection>` ← inserted here**
4. `<RentMissingBanner>` (amber alert, only when unpaid — unchanged)
5. Assign Room button
6. TenantPaymentSection
7. NotesSection
8. Danger Zone

## Icon Decision
Reuse `BalanceStatusIndicator` as-is (inside `BalanceSection`):
- `CheckCircle` (green) + "Paid" for `status === "paid"`
- `AlertCircle` (red) + "Unpaid" for `status === "unpaid"`

This satisfies the user requirement to prioritise consistency — no new icon choices.

## Changes Required
| File | Change |
|------|--------|
| `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx` | Import `BalanceSection`, render it between tenant info and `RentMissingBanner` |

## No changes needed
- `BalanceSection` component — already correct
- `BalanceStatusIndicator` — already correct
- `RentMissingBanner` — stays as-is
- Locales — no new keys
- Prisma schema — no changes
- API routes — no changes
