# Finance Cashflow — Requirements

## Source
GitHub Issue #69: [Finance] — Monthly cashflow detail page (unified income + expense timeline)

## Acceptance Criteria

### AC-1: Entry point
- The Net Income `SummaryCard` on `/properties/[propertyId]/finance` links to `/properties/[propertyId]/finance/cashflow`
- The link passes the current selected month/year as query params (`?year=YYYY&month=MM`)

### AC-2: API
- `GET /api/properties/[propertyId]/finance/cashflow?year=YYYY&month=MM` returns HTTP 200 with a flat array of `CashflowEntry` sorted by date descending
- Returns HTTP 400 for missing or invalid year/month query params
- Returns HTTP 401 if user is not authenticated
- Returns HTTP 403 if user does not own the property
- Each entry has: `id`, `date` (ISO string), `type` (`"income" | "expense"`), `description` (tenant name for income; category label for expense), `amount` (positive number)
- Income entries come from `Payment` records for the property in the given month
- Expense entries come from `Expense` records for the property in the given month
- Results never include data from other landlords' properties

### AC-3: UI — page
- Page lives at `/properties/[propertyId]/finance/cashflow`
- Defaults to current month on first load
- Month navigation via `MonthSelector` (same component as finance overview)
- Displays a chronological list (date descending) of all income and expense entries
- Income rows: green amount with `+` prefix
- Expense rows: red amount with `−` prefix (minus sign)
- Each row shows: date, description, and amount
- Empty state message when no transactions exist for the selected month
- Loading skeleton/indicator while fetching
- Mobile-first: single column, no horizontal scroll at 320px
- Touch targets ≥ 44×44px on interactive elements

### AC-4: i18n
- All new UI strings use i18n keys
- Keys added to both `locales/en.json` and `locales/id.json`

### AC-5: No schema changes
- Reads from existing `Payment` and `Expense` tables only

## Out of Scope
- Pagination (full month displayed at once)
- Filtering by type (income/expense)
- Edit/delete from this view
- Export
