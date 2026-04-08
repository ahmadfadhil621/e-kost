# Design: Finance Staff Summary (Issue #109)

## Correctness Properties

### Property 1: Staff row isolation
Staff users always receive 0 or 1 rows in the summary response — never rows belonging to other actors.

### Property 2: Owner completeness
Owner receives all rows from the repository, with no filtering applied.

### Property 3: Non-negative totals
All `totalPayments` and `totalExpenses` values in the response are non-negative numbers.

### Property 4: actorId persistence
When a payment or expense is created, the authenticated user's ID is stored as `actorId` on the record.

---

## Schema Changes

> **User must apply these changes in Supabase first. Do NOT edit `prisma/schema.prisma` directly.**

```prisma
model Payment {
  // ... existing fields ...
  actorId  String?
  actor    User?   @relation("PaymentActor", fields: [actorId], references: [id], onDelete: SetNull, onUpdate: NoAction)

  @@index([tenantId, paymentDate])
  // Add: @@index([actorId])
}

model Expense {
  // ... existing fields ...
  actorId  String?
  actor    User?   @relation("ExpenseActor", fields: [actorId], references: [id], onDelete: SetNull, onUpdate: NoAction)

  @@index([propertyId, date])
  // Add: @@index([actorId])
}
```

After applying in Supabase: run `npx prisma db pull && npx prisma generate`.

---

## Domain Schema

**File**: `src/domain/schemas/staff-summary.ts`

```ts
import { z } from "zod";

export const staffSummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export interface StaffSummaryEntry {
  actorId: string;
  actorName: string;
  actorRole: string;
  totalPayments: number;
  totalExpenses: number;
}

export type StaffSummaryQuery = z.infer<typeof staffSummaryQuerySchema>;
```

---

## Repository Interface

**File**: `src/domain/interfaces/staff-summary-repository.ts`

```ts
import type { StaffSummaryEntry } from "@/domain/schemas/staff-summary";

export interface IStaffSummaryRepository {
  getSummaryByPeriod(
    propertyId: string,
    year: number,
    month: number
  ): Promise<StaffSummaryEntry[]>;
}
```

---

## Repository Implementation

**File**: `src/lib/repositories/prisma/prisma-staff-summary-repository.ts`

- Uses `prisma.payment.groupBy` with `by: ["actorId"]` for the period, joined with User for name/role
- Uses `prisma.expense.groupBy` with `by: ["actorId"]` for the period
- Fetches User rows for all discovered actorIds (join via `prisma.user.findMany`)
- Merges payment and expense totals by actorId
- Returns only rows where actorId is non-null
- `actorRole` comes from the property membership (userProperty table or similar)

> Note: Since Prisma groupBy doesn't do cross-table joins directly, the implementation will:
> 1. GroupBy actorId on payments with SUM(amount) for the period
> 2. GroupBy actorId on expenses with SUM(amount) for the period
> 3. Collect all unique actorIds
> 4. Fetch User records for those actorIds
> 5. Fetch UserProperty records to get role for each actorId on this property
> 6. Merge into StaffSummaryEntry[]

---

## Service

**File**: `src/lib/staff-summary-service.ts`

```ts
export class StaffSummaryService {
  constructor(
    private readonly repo: IStaffSummaryRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async getStaffSummary(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<StaffSummaryEntry[]> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const all = await this.repo.getSummaryByPeriod(propertyId, year, month);
    // Staff sees only their own row
    if (role !== "owner") {
      return all.filter((e) => e.actorId === userId);
    }
    return all;
  }
}
```

**Instance file**: `src/lib/staff-summary-service-instance.ts`

---

## Payment/Expense — Store actorId on Create

### Payment repository change

`PrismaPaymentRepository.create` signature gains optional `actorId?: string`:

```ts
async create(data: {
  tenantId: string;
  amount: number;
  paymentDate: Date;
  billingCycleId?: string;
  note?: string;
  actorId?: string;         // NEW
}): Promise<Payment>
```

Payment service `createPayment` already receives `userId` — passes it through to the repo.

### Expense repository change

`PrismaExpenseRepository.create` signature gains optional `actorId?: string`:

```ts
async create(data: {
  propertyId: string;
  category: string;
  amount: number;
  date: Date;
  description?: string;
  actorId?: string;         // NEW
}): Promise<Expense>
```

Expense service `createExpense` receives `userId` — passes it through.

---

## API Route

**File**: `src/app/api/properties/[propertyId]/finance/staff-summary/route.ts`

- `GET` handler
- Uses `withPropertyAccess` (same pattern as summary route)
- Validates `year` and `month` with `staffSummaryQuerySchema`
- Calls `staffSummaryService.getStaffSummary(userId, propertyId, year, month)`
- Returns `{ data: StaffSummaryEntry[] }` with status 200
- Returns 400 for invalid params, 401/403 from middleware

---

## UI — Finance Page Section

**File**: `src/app/(app)/properties/[propertyId]/finance/page.tsx`

Add below the existing SummaryCard section:

- New `fetchStaffSummary` fetch function calling the new API route
- New `useQuery` with key `["staff-summary", propertyId, year, month]`
- Renders a `<StaffSummarySection>` component (or inline)

**Component**: `src/components/finance/staff-summary-section.tsx`

- Props: `{ entries: StaffSummaryEntry[]; isLoading: boolean; formatCurrency: (n: number) => string }`
- Shows section title: `t("finance.staffSummary.title")`
- Loading: skeleton or `t("common.loading")`
- Empty: `t("finance.staffSummary.empty")`
- Each row: actor name, `t("finance.staffSummary.collected")`: totalPayments, `t("finance.staffSummary.added")`: totalExpenses

---

## i18n Keys

### `locales/en.json` (under `finance`):

```json
"staffSummary": {
  "title": "Staff Summary",
  "collected": "Collected",
  "added": "Added",
  "empty": "No activity recorded this month.",
  "noData": "No data available."
}
```

### `locales/id.json` (under `finance`):

```json
"staffSummary": {
  "title": "Ringkasan Staf",
  "collected": "Dikumpulkan",
  "added": "Ditambahkan",
  "empty": "Tidak ada aktivitas yang tercatat bulan ini.",
  "noData": "Tidak ada data tersedia."
}
```

---

## Correctness Properties

1. Staff can never see other staff's rows — enforced in service layer
2. `actorId = null` rows are silently excluded — not surfaced to any user
3. The same period filter (year/month) is applied consistently to both Payment and Expense groupings
4. Totals are always positive numbers (payments and expenses are both stored as positive)
