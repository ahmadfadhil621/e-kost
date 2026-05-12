# Finance Cashflow Export — Design (Issue #125, F-4f)

## Domain

### CashflowExportRow (new)
```typescript
interface CashflowExportRow {
  id: string;
  date: Date;
  type: "income" | "expense";
  category: string | null;    // null for income rows
  tenantName: string | null;  // null for expense rows
  amount: number;
  notes: string | null;       // payment.note or expense.description
}

interface CashflowExportFilters {
  year?: number;
  month?: number;
}
```

### ICashflowRepository — new method
```typescript
findForExport(propertyId: string, filters: CashflowExportFilters): Promise<CashflowExportRow[]>
```

## Service

`CashflowService.exportCashflow(userId, propertyId, filters, timezone, locale)`
- Validates property access.
- Calls `repo.findForExport`.
- Throws `ExportRowCapError` if rows > 10,000.
- Builds XLSX via `buildCashflowXlsx(rows, timezone, locale)`.
- Returns `{ buffer, filename }`.

## XLSX Structure
- Row 1: headers (locale-aware)
- Rows 2..N+1: data rows
- Row N+2: Total Income (computed)
- Row N+3: Total Expenses (computed)
- Row N+4: Net Income (computed)

## API Route
`GET /api/properties/[propertyId]/finance/cashflow/export`
- Query params: `year`, `month` (both optional, validated with cashflowQuerySchema partially)
- Same auth/error pattern as `/payments/export`.

## UI
Add download icon button to cashflow page toolbar (alongside MonthSelector).
- Passes `year` and `month` as query params.
- Disabled when `entries.length === 0`.

## i18n Keys
- `finance.cashflow.export.button`
- `finance.cashflow.export.disabledTooltip`
- `finance.cashflow.export.errorToast`
- Sheet header labels: handled in service code (locale-based string selection).

## Correctness Properties
- PROP-1: Export always produces valid XLSX structure regardless of row count (0..N).
