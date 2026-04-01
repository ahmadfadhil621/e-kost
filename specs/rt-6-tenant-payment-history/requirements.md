# RT-6 — Tenant Payment History: Truncate + Full History Page

## Acceptance Criteria

### AC-1: Truncated Summary on Tenant Detail
- Payment History section on Tenant Detail shows at most 3 most recent entries (ordered by paymentDate DESC, createdAt DESC)
- When total payments > 3, a "View all" link is shown beneath the list
- The link navigates to the Full Payment History page for that tenant
- The total count label still reflects the real count (not capped at 3)

### AC-2: Full Payment History Page
- Route: `/properties/[propertyId]/tenants/[tenantId]/payments`
- Displays all payments for the tenant in descending order (paymentDate DESC, createdAt DESC)
- Implements page-based pagination: 20 items per page
- Shows "Previous" / "Next" navigation controls; Previous disabled on page 1, Next disabled on last page
- Supports delete (same confirmation dialog as property payments page)
- Page number is derived from `?page=N` URL search param (defaults to 1)

### AC-3: Delete Button UX
- Delete action on payment cards (in `PaymentList`) is moved from a full-width destructive button to a 3-dot overflow menu (DropdownMenu)
- The menu contains a single "Delete" item styled as destructive
- Applies to both the property-wide payments page and the new full history page
- `TenantPaymentSection` (summary) has no delete action

### AC-4: API Pagination
- `GET /api/properties/[propertyId]/tenants/[tenantId]/payments` accepts optional `?limit=N&page=P` query params
- Default: all payments returned (no limit) — preserves existing callers
- With `limit=3`: returns the 3 most recent + totalCount
- With `limit=20&page=2`: returns items 21-40 + totalCount + totalPages
- Response shape: `{ payments, count, totalPages? }`

### AC-5: i18n
- All new user-facing strings in `locales/en.json` and `locales/id.json`
- No hardcoded English strings in components
