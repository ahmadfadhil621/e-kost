# RT-6 — Design

## API Changes

### `GET /api/properties/[propertyId]/tenants/[tenantId]/payments`

Query params (all optional):
- `limit` — integer, max items to return (for summary: 3)
- `page` — integer ≥ 1 (for paginated full history, used with limit)

Response:
```json
{
  "payments": [...],
  "count": 42,
  "totalPages": 3
}
```
`totalPages` only present when `limit` is supplied.

## Repository Interface Change

`findByTenant(tenantId, options?)` where:
```ts
options?: { limit?: number; page?: number }
```
Returns `PaymentWithCount & { totalPages?: number }`.

## Service Change

`listTenantPayments(userId, propertyId, tenantId, options?)` — passes options through to repo.

## New Page

Route: `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/payments/page.tsx`
- Client component using `useSearchParams()` for `?page=N`
- Calls `GET …/tenants/[tenantId]/payments?limit=20&page=N`
- Back link to tenant detail
- Title: i18n key `payment.fullHistory.title`
- Reuses `PaymentList` with delete

## Component Changes

### `TenantPaymentSection`
- New prop: `propertyId: string`
- Data fetch: `…?limit=3` (still from parent page)
- Show first 3 of the already-limited response
- "View all" link: visible only when `count > 3`

### `PaymentList` (delete UX)
- Replace `<Button variant="destructive">` with `<DropdownMenu>` trigger (MoreVertical icon)
- Menu item: "Delete" in destructive text color
- Dialog logic unchanged
- Existing `onDeletePayment` / `isDeletingPayment` props unchanged

## i18n Keys

New keys under `payment`:
```json
"tenantSection": {
  "viewAll": "View all payments"
},
"fullHistory": {
  "title": "Payment History",
  "backToTenant": "Back to tenant"
},
"pagination": {
  "previous": "Previous",
  "next": "Next",
  "pageOf": "Page {{page}} of {{total}}"
}
```
