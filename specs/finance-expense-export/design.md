# Design — Finance: Export Expenses Register to XLSX (Issue #122)

## Domain Layer

### `src/domain/schemas/expense.ts` (extend)
Add `expenseExportFilterSchema` and `ExpenseExportRow`:
```ts
export const expenseExportFilterSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  category: z.enum(expenseCategories).optional(),
});
export type ExpenseExportFilters = z.infer<typeof expenseExportFilterSchema>;

export interface ExpenseExportRow {
  date: Date;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
}
```

## Repository Layer

### `src/domain/interfaces/expense-repository.ts` (extend)
Add `findForExport` method:
```ts
findForExport(propertyId: string, filters: ExpenseExportFilters): Promise<ExpenseExportRow[]>
```

### `src/lib/repositories/prisma/prisma-expense-repository.ts` (extend)
Implement `findForExport`:
- Filter: `year`/`month` mapped to date range (`date >= first-day` AND `date <= last-day`)
- Filter: `category` mapped via `DOMAIN_TO_PRISMA` when provided
- Order: `date desc`, `createdAt desc`
- Limit: fetch up to 10,001 rows (for over-cap detection at service layer)
- Return `ExpenseExportRow[]` (id, propertyId, createdAt, updatedAt NOT included)

## Service Layer

### `src/lib/expense-service.ts` (extend)
Export `ExportRowCapError` class (same pattern as `payment-service.ts`).

Add `exportExpenses(userId, propertyId, filters, userTimezone, userLocale)`:
- Call `propertyAccess.validateAccess(userId, propertyId)`
- Call `repo.findForExport(propertyId, filters)` (10,001 row limit enforced in repo)
- If rows.length > 10,000: throw `ExportRowCapError`
- Build XLSX buffer using `exceljs` (server-only import via dynamic import guard)
- Sheet columns: Date, Category, Amount (IDR), Description
- Date formatted per `userLocale` and `userTimezone`
- Category formatted as locale-aware label (EN: title case, ID: Indonesian label)
- Totals row: `=SUM(C2:C<lastDataRow>)` on Amount column (column C, 1-based)
- Return `{ buffer: Buffer; filename: string }`

#### Filename logic:
```
if year && month:
  firstDay = YYYY-MM-01
  lastDay  = last calendar day of that month in user timezone
  → `expenses-${firstDay}_to_${lastDay}.xlsx`
else:
  → `expenses-${todayInUserTimezone}.xlsx`
```

#### Category label map (en):
```ts
{ electricity: "Electricity", water: "Water", internet: "Internet",
  maintenance: "Maintenance", cleaning: "Cleaning", supplies: "Supplies",
  tax: "Tax", transfer: "Transfer", other: "Other" }
```
#### Category label map (id):
```ts
{ electricity: "Listrik", water: "Air", internet: "Internet",
  maintenance: "Perawatan", cleaning: "Kebersihan", supplies: "Perlengkapan",
  tax: "Pajak", transfer: "Transfer", other: "Lainnya" }
```

## API Layer

### New: `src/app/api/properties/[propertyId]/expenses/export/route.ts`
```
GET /api/properties/[propertyId]/expenses/export?year=2025&month=5&category=electricity
```
- Auth: `withPropertyAccess`
- Parse query params with `expenseExportFilterSchema`
- Fetch user timezone + language via `userService`
- Call `expenseService.exportExpenses(...)`
- Return binary response with:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="<filename>"`
- On `ExportRowCapError`: 400 `{ error: message }`
- On other errors: 500

## UI Layer

### Update: `src/app/(app)/properties/[propertyId]/finance/expenses/page.tsx`
- Import `Download` from `lucide-react`
- Import `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` from shadcn
- Add download button to toolbar (alongside "Add Expense" button)
- Button href: `/api/properties/${propertyId}/expenses/export?year=${year}&month=${month}${category ? `&category=${category}` : ''}`
- Disabled + tooltip when `expenses.length === 0`
- On click: `window.location.href = ...` (browser-native file download)
- i18n key: `expense.export.button`, `expense.export.disabledTooltip`

Note: The expenses page currently doesn't have an active `category` filter state — only year/month. The export URL will include year and month always; category only if the page gains a category filter. For now, pass year+month only.

## i18n Keys

### `locales/en.json` (under `expense`)
```json
"export": {
  "button": "Export",
  "disabledTooltip": "No expenses to export",
  "errorToast": "Failed to export expenses",
  "columns": {
    "date": "Date",
    "category": "Category",
    "amount": "Amount (IDR)",
    "description": "Description"
  },
  "rowCapError": "Export limit exceeded: maximum 10,000 rows allowed"
}
```

### `locales/id.json` (under `expense`)
```json
"export": {
  "button": "Ekspor",
  "disabledTooltip": "Tidak ada pengeluaran untuk diekspor",
  "errorToast": "Gagal mengekspor pengeluaran",
  "columns": {
    "date": "Tanggal",
    "category": "Kategori",
    "amount": "Jumlah (IDR)",
    "description": "Deskripsi"
  },
  "rowCapError": "Batas ekspor terlampaui: maksimum 10.000 baris diizinkan"
}
```

## Correctness Properties

### Property 1: XLSX row count invariant
Export always produces header row + N data rows + totals row (N + 2 rows total), for any N in 0..10,000.

### Property 2: Empty export validity
Export with 0 rows → valid XLSX, headers present, SUM formula present.

### Property 3: Row cap enforcement
Export with N > 10,000 rows → HTTP 400, no file download.

### Property 4: Server-only exceljs
exceljs never imported in any client component.

### Property 5: Filename derivation
Filename uses `expenses-YYYY-MM-01_to_YYYY-MM-LD.xlsx` when year+month provided, `expenses-<today>.xlsx` otherwise.

### Property 6: Date formatting
Date formatted using Intl.DateTimeFormat with user's timezone and locale (DD/MM/YYYY for id, MM/DD/YYYY for en).

### Property 7: Category translation
Category rendered as locale-aware label (server-side), not raw enum value.
