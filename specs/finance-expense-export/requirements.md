# Requirements — Finance: Export Expenses Register to XLSX (Issue #122)

## Acceptance Criteria

### AC-1 — Happy path export
- GET `/api/properties/[propertyId]/expenses/export` returns 200 with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition` header set to `attachment; filename="<filename>"`
- When `year` and `month` are provided, filename is `expenses-YYYY-MM-01_to_YYYY-MM-LD.xlsx` (first to last day of that month)
- When no year/month provided, filename is `expenses-<today-in-user-timezone>.xlsx`

### AC-2 — Columns
- Sheet has 4 data columns: Date, Category, Amount (IDR), Description
- Date formatted per user's locale and timezone
- Category rendered as human-readable label (locale-aware)
- Totals row with SUM formula on Amount column

### AC-3 — Filters
- Export respects `year`, `month`, `category` query params (same as list endpoint)
- Exports exactly the rows visible in the current list view

### AC-4 — Empty result
- Export with 0 matching rows returns a valid XLSX with headers only (no error)

### AC-5 — Row cap
- Export with > 10,000 rows returns HTTP 400 with `{ error: "Export limit exceeded: maximum 10,000 rows allowed" }`

### AC-6 — Auth
- Returns 401 when unauthenticated
- Returns 403 when user has no property access

### AC-7 — UI affordance
- Download icon button appears in the expenses list toolbar
- Button is disabled (with tooltip) when expenses list is empty
- On click: triggers browser-native file download (no mutation, plain GET)
- Tooltip shown on disabled state: "No expenses to export"

### AC-8 — Filter param validation
- Returns 400 for invalid `year` (out of 2000–2100 range)
- Returns 400 for invalid `month` (out of 1–12 range)
- Returns 400 for unrecognised `category` value

### AC-9 — Server-only import
- `exceljs` must never be imported in any client component
