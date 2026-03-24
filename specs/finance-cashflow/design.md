# Finance Cashflow — Design

## Domain Schema

**File**: `src/domain/schemas/cashflow.ts`

```ts
export const cashflowQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export interface CashflowEntry {
  id: string;
  date: string;           // ISO date string (YYYY-MM-DD)
  type: "income" | "expense";
  description: string;   // tenant name for income; category key for expense
  amount: number;        // always positive
}
```

## Repository Interface

**File**: `src/domain/interfaces/cashflow-repository.ts`

```ts
export interface ICashflowRepository {
  findByPropertyAndMonth(
    propertyId: string,
    year: number,
    month: number
  ): Promise<CashflowEntry[]>;
}
```

## Repository Implementation

**File**: `src/lib/repositories/prisma/prisma-cashflow-repository.ts`

- Fetches `Payment` records joined with `tenant` (for `tenant.name`) where `tenant.propertyId = propertyId` and `paymentDate` within the month
- Fetches `Expense` records where `propertyId = propertyId` and `date` within the month
- Maps payments → `{ id, date: paymentDate.toISOString().slice(0,10), type: "income", description: tenant.name, amount }`
- Maps expenses → `{ id, date: expense.date.toISOString().slice(0,10), type: "expense", description: expense.category, amount }`
- Merges and sorts by date descending (then by createdAt descending for ties)

## Service

**File**: `src/lib/cashflow-service.ts`

```ts
export class CashflowService {
  constructor(
    private readonly repo: ICashflowRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async getMonthlyCashflow(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<CashflowEntry[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    return this.repo.findByPropertyAndMonth(propertyId, year, month);
  }
}
```

**Instance file**: `src/lib/cashflow-service-instance.ts` (wires Prisma repo + propertyService)

## API Route

**File**: `src/app/api/properties/[propertyId]/finance/cashflow/route.ts`

- `GET` handler
- Validates `year` and `month` query params with `cashflowQuerySchema`
- Uses `withPropertyAccess` middleware (same pattern as summary route)
- Calls `cashflowService.getMonthlyCashflow`
- Returns `NextResponse.json(entries)` with status 200
- Returns 400 for invalid query params, 401/403 from middleware

## UI Page

**File**: `src/app/(app)/properties/[propertyId]/finance/cashflow/page.tsx`

- Client component (`"use client"`)
- Reads `propertyId` from `useParams()`
- Month state initialized to `new Date()` (current month), same pattern as finance overview
- `MonthSelector` for navigation
- `useQuery` with key `["cashflow", propertyId, year, month]`
- Renders list of `CashflowEntryRow` items
- Income: green text `+{formatCurrency(amount)}`
- Expense: red text `−{formatCurrency(amount)}`
- Empty state: `t("finance.cashflow.empty")`

## Finance Overview — Wire NetIncome Card

**File**: `src/app/(app)/properties/[propertyId]/finance/page.tsx`

Change:
```tsx
<SummaryCard
  label={t("finance.netIncome")}
  amount={data.netIncome}
  variant="net"
  formatCurrency={formatCurrency}
/>
```
To:
```tsx
<SummaryCard
  label={t("finance.netIncome")}
  amount={data.netIncome}
  variant="net"
  formatCurrency={formatCurrency}
  href={`/properties/${propertyId}/finance/cashflow`}
/>
```

## i18n Keys

Add to `locales/en.json` under `"finance"`:
```json
"cashflow": {
  "title": "Cashflow",
  "empty": "No transactions for this month"
}
```

Add to `locales/id.json` under `"finance"`:
```json
"cashflow": {
  "title": "Arus Kas",
  "empty": "Tidak ada transaksi bulan ini"
}
```

## Correctness Properties

1. Entries from other properties must never appear in the response
2. `amount` is always positive regardless of type
3. Results always sorted date descending
4. Month boundary: entries for day 1 and last day of month are included; day before and after are excluded
5. Empty month returns `[]` not null/undefined

## Component Reuse

- `MonthSelector` — existing, no changes
- `SummaryCard` — existing, `href` prop added in Issue #68, no changes needed
- `useFormatCurrency` — existing hook
