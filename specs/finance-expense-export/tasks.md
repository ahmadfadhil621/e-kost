# Tasks — Finance: Export Expenses Register to XLSX (Issue #122)

## Layer 1 — Domain
- [x] Add `expenseExportFilterSchema`, `ExpenseExportFilters`, `ExpenseExportRow` to `src/domain/schemas/expense.ts`
- [x] Add `findForExport(propertyId, filters)` signature to `src/domain/interfaces/expense-repository.ts`

## Layer 2 — Repository
- [x] Implement `findForExport` in `src/lib/repositories/prisma/prisma-expense-repository.ts`

## Layer 3 — Service
- [x] Add `ExportRowCapError` export to `src/lib/expense-service.ts`
- [x] Add `exportExpenses(userId, propertyId, filters, userTimezone, userLocale)` to `ExpenseService`

## Layer 4 — API
- [x] Create `src/app/api/properties/[propertyId]/expenses/export/route.ts`

## Layer 5 — UI
- [x] Add export download button to `src/app/(app)/properties/[propertyId]/finance/expenses/page.tsx`

## Layer 6 — i18n
- [x] Add `expense.export.*` keys to `locales/en.json`
- [x] Add `expense.export.*` keys to `locales/id.json`

## Tests
- [x] Vitest: service unit tests (Good/Bad/Edge) — `src/lib/expense-service.export.test.ts`
- [x] Vitest: API route tests (Good/Bad/Edge) — `src/app/api/properties/[propertyId]/expenses/export/route.test.ts`
- [x] Playwright E2E: export button click downloads file — `e2e/finance/export-expenses.spec.ts`
