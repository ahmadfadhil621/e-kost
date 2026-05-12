# Finance Cashflow Export — Requirements (Issue #125, F-4f)

## Acceptance Criteria

- **AC-1** Service `exportCashflow(userId, propertyId, filters, timezone, locale)` returns `{ buffer, filename }`.
  - filename: `cashflow-<year>-<MM>.xlsx` when year+month provided; `cashflow-<today>.xlsx` otherwise.
- **AC-2** XLSX has 6 columns: Date, Type, Category, Tenant, Amount (IDR), Notes.
  - Date: locale-formatted (DD/MM/YYYY for id, MM/DD/YYYY for en).
  - Type: "Income"/"Expense" (en) or "Pemasukan"/"Pengeluaran" (id).
  - Category: localized expense category label; blank for income rows.
  - Tenant: tenant name for income rows; blank for expense rows.
  - Amount: numeric.
  - Notes: payment.note or expense.description; blank when null.
- **AC-3** 3 summary rows after data: Total Income, Total Expenses, Net Income (computed values).
- **AC-4** 0 data rows still produces a valid XLSX with headers and 3 summary rows.
- **AC-5** More than 10,000 rows throws `ExportRowCapError`; exactly 10,000 rows succeeds.
- **AC-6** API `GET /api/properties/[propertyId]/finance/cashflow/export?year=YYYY&month=MM`
  - Returns `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Returns `Content-Disposition: attachment; filename="..."`.
  - Returns 400 on invalid query params or row cap exceeded.
  - Returns 401/403 on auth failure.
- **AC-7** UI: download icon button on cashflow page toolbar, passes current year/month as query params.
  - Disabled when entries list is empty.
- **AC-8** i18n keys added to locales/en.json and locales/id.json.
