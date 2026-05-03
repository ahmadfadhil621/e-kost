# Requirements — Finance: Export Payments Register to XLSX (Issue #121)

## User Story

As a landlord, I want to export my payments register to an XLSX file so I can reconcile against my monthly bank statement.

## Acceptance Criteria

### AC-1: Export endpoint
- `GET /api/properties/[propertyId]/payments/export` returns an XLSX file
- Auth-gated via `withPropertyAccess` (same as list endpoint)
- Accepts optional query params: `dateFrom` (YYYY-MM-DD), `dateTo` (YYYY-MM-DD)
- Uses the same Zod filter schema as the list endpoint (`paymentFilterSchema`)

### AC-2: XLSX structure
- Sheet contains 6 columns: Date, Tenant, Room, Period, Amount (IDR), Notes
- One data row per payment, ordered by paymentDate desc then createdAt desc
- Final row: totals row with `=SUM()` Excel formula on the Amount column
- Headers are translatable (en + id)

### AC-3: Column values
- **Date**: formatted as `DD/MM/YYYY` for `id` locale, `MM/DD/YYYY` for `en` locale, in the user's stored timezone
- **Tenant**: tenant name
- **Room**: room number resolved from `room_assignment` history (assignment whose `startDate ≤ paymentDate` and `endDate > paymentDate OR endDate IS NULL`); blank if none found
- **Period**: `MM/YYYY` from linked `billing_cycle`; blank if none
- **Amount (IDR)**: numeric value (not a string); formatted as number in Excel
- **Notes**: `note` field; blank if null

### AC-4: Filename
- With date filter: `payments-<dateFrom>_to_<dateTo>.xlsx`
- Without date filter: `payments-<today>.xlsx` (today in user's timezone)

### AC-5: Row cap
- Max 10,000 rows; over-cap returns HTTP 400 with translated error message
- Under-cap (including 0 rows): always produce a valid XLSX with headers and totals row

### AC-6: Empty result
- 0 data rows: produce XLSX with headers + totals row showing `=SUM()` over empty range (evaluates to 0)

### AC-7: UI — Download button
- Download icon button appears top-right of the payments list toolbar (next to "Record Payment")
- Disabled with tooltip when payments list has 0 rows
- On click: triggers GET to the export endpoint, downloads the resulting file
- Shows error toast if export request fails

### AC-8: Filter schema parity
- A shared `paymentFilterSchema` Zod schema lives in `src/domain/schemas/payment.ts`
- Both the list endpoint (`GET /api/properties/[propertyId]/payments`) and the export endpoint use it to parse query params

### AC-9: Server-only import
- `exceljs` must only be imported in server-side files (API route or service); must not appear in any client component or hook

### AC-10: i18n
- New keys added to both `locales/en.json` and `locales/id.json`
- Keys: export button label, tooltip (disabled state), error toast, XLSX column headers

## Out of Scope
- Date range filter UI controls on the payments list (future issue)
- Audit log / rate limiting
- Method/payment method column (no such field in schema)
- Non-XLSX formats
