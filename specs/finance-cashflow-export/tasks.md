# Finance Cashflow Export — Tasks (Issue #125, F-4f)

- [ ] Domain: add `CashflowExportRow`, `CashflowExportFilters` to `src/domain/schemas/cashflow.ts`
- [ ] Domain: add `findForExport` to `ICashflowRepository`
- [ ] Tests: write `src/lib/cashflow-service.export.test.ts`
- [ ] Tests: write `src/app/api/properties/[propertyId]/finance/cashflow/export/route.test.ts`
- [ ] Tests: write `e2e/finance/cashflow-export.spec.ts`
- [ ] Service: add `ExportRowCapError`, `exportCashflow` to `CashflowService`
- [ ] Repository: implement `findForExport` in `PrismaCashflowRepository`
- [ ] API: create `src/app/api/properties/[propertyId]/finance/cashflow/export/route.ts`
- [ ] UI: add download button to cashflow page
- [ ] i18n: add export keys to `locales/en.json` and `locales/id.json`
