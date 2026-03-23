# Finance Summary Card Detail Popup — Design

## Data Availability Decision

### Problem
`FinanceSummaryCard` currently receives `FinanceSummarySnapshot { month, year, income, expenses, netIncome }`.
Expense category breakdown is needed for REQ 4 but is not in this type.

### Option A — Extend Snapshot (chosen)
Add `categoryBreakdown: CategoryBreakdown[]` to `FinanceSummarySnapshot`.
Pass it through from `FinanceSummaryService.getMonthlySummary()` which already computes it.

**Why chosen:**
- `getMonthlySummary()` already computes `categoryBreakdown` on every dashboard load.
  The `dashboard-service-instance.ts` adapter drops it by only mapping 5 fields.
- Adding one field to the return value costs nothing at runtime.
- The dashboard query is cached by React Query (`staleTime: 60_000`). Satisfies REQ 8 (no new API requests).
- Max 9 category entries — payload impact is negligible.

### Option B — Lazy-fetch on popup open (rejected)
Fetch `/api/properties/{id}/finance/summary` when user taps the row.

**Why rejected:**
- Introduces a visible loading spinner every time the popup opens.
- Requires an extra network round-trip for data that is already computed.
- Adds complexity (error state, retry logic) for no benefit.

---

## Component Architecture

### New component: `FinanceDetailDialog`
`src/components/dashboard/FinanceDetailDialog.tsx`

Props:
```ts
interface FinanceDetailDialogProps {
  type: "income" | "expenses" | null;  // null = dialog closed
  finance: FinanceSummarySnapshot;
  formatCurrency: (n: number) => string;
  onClose: () => void;
}
```

Renders a single shadcn `Dialog` with conditional content:
- `type === "income"` → Income Detail mode
- `type === "expenses"` → Expense Breakdown mode
- `type === null` → Dialog is closed (open={false})

Category list: filtered (`total > 0`), sorted by `total` descending, displayed with
`t("expense.category.{key}")` labels (keys already exist in both locale files).

### Updated component: `FinanceSummaryCard`
`src/components/dashboard/FinanceSummaryCard.tsx`

Changes:
1. Add `useState<"income" | "expenses" | null>(null)` — `activePopup`
2. Wrap Income `<div>` in `<button data-testid="finance-income-trigger" onClick={() => setActivePopup("income")}>`
3. Wrap Expenses `<div>` similarly with `data-testid="finance-expenses-trigger"`
4. Render `<FinanceDetailDialog type={activePopup} finance={finance} formatCurrency={formatCurrency} onClose={() => setActivePopup(null)} />`

### Domain change: `FinanceSummarySnapshot`
`src/domain/schemas/dashboard.ts`

Add `categoryBreakdown: CategoryBreakdown[]` (imported from `@/domain/schemas/expense`).

### Cascade fixes
| File | Change |
|------|--------|
| `src/lib/dashboard-service.ts` | Add `categoryBreakdown` to `IFinanceSummarySnapshotSource` return type |
| `src/lib/dashboard-service.ts` | Add `categoryBreakdown: financeRaw.categoryBreakdown` to finance construction |
| `src/lib/dashboard-service-instance.ts` | Add `categoryBreakdown: summary.categoryBreakdown` to adapter return |
| `src/test/fixtures/dashboard.ts` | Add `categoryBreakdown: []` default in `createFinanceSummarySnapshot` |

Dashboard API route (`route.ts`) does **not** need changes — it serializes `data.finance` directly via JSON spread.

---

## i18n Keys

Added under `dashboard.finance` in both locale files:

| Key | English | Indonesian |
|-----|---------|-----------|
| `dashboard.finance.incomeDetail.title` | Income Detail | Detail Pemasukan |
| `dashboard.finance.incomeDetail.fromRent` | From rent payments | Dari pembayaran sewa |
| `dashboard.finance.expensesDetail.title` | Expense Breakdown | Rincian Pengeluaran |
| `dashboard.finance.expensesDetail.noExpenses` | No expenses recorded | Belum ada pengeluaran |

Existing `expense.category.*` keys are reused for category labels.
