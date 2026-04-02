# Billing Cycle Tracking — Design

## Architecture

**Full-stack feature.** Requires:
- New Prisma model (`BillingCycle`)
- Optional FK from `Payment` → `BillingCycle`
- New domain schema + repository interface
- Prisma repository implementation
- Updated balance service (per-cycle breakdown)
- Updated payment service (cycle assignment on create)
- New API route (billing cycles list)
- Updated balance API response shape
- Updated `BalanceSection` UI
- Updated `PaymentForm` UI (billing period dropdown)
- Updated demo seed data

---

## Schema Changes (require user approval before editing `prisma/schema.prisma`)

### New model: `BillingCycle`

```prisma
model BillingCycle {
  id        String    @id @default(uuid())
  tenantId  String
  year      Int
  month     Int       // 1–12
  createdAt DateTime  @default(now())
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  payments  Payment[]

  @@unique([tenantId, year, month])
  @@index([tenantId])
  @@map("billing_cycle")
}
```

### Changes to `Payment`

Add one optional field:
```prisma
billingCycleId String?
billingCycle   BillingCycle? @relation(fields: [billingCycleId], references: [id])
```

### Changes to `Tenant`

Add reverse relation:
```prisma
billingCycles BillingCycle[]
```

---

## Domain Layer

### New file: `src/domain/schemas/billing-cycle.ts`

```typescript
export interface BillingCycle {
  id: string;
  tenantId: string;
  year: number;
  month: number;
  createdAt: Date;
}

// Status of a single (year, month) period for a tenant
export interface CycleStatus {
  year: number;
  month: number;
  cycleId: string | null;    // null = no payments ever recorded for this month
  totalPaid: number;
  monthlyRent: number;
  status: "paid" | "partial" | "unpaid";
  amountOwed: number;        // max(0, monthlyRent - totalPaid)
}

// Returned by balance service and balance API
export interface BillingCycleBreakdown {
  tenantId: string;
  unpaidCycles: CycleStatus[];  // partial + unpaid only, sorted oldest first
  allPaid: boolean;
}
```

### New file: `src/domain/interfaces/billing-cycle-repository.ts`

```typescript
export interface IBillingCycleRepository {
  // Creates a new cycle row if not already present; returns existing if it is
  findOrCreate(tenantId: string, year: number, month: number): Promise<BillingCycle>;
  // Returns all cycles that have at least one payment, with aggregated totalPaid
  findWithPaymentSums(tenantId: string): Promise<Array<{
    id: string;
    year: number;
    month: number;
    totalPaid: number;
  }>>;
}
```

### Updated: `src/domain/schemas/payment.ts`

Add to `createPaymentSchema`:
```typescript
billingCycleId: z.string().uuid().optional(),
```

Add to `Payment` interface:
```typescript
billingCycleId?: string | null;
```

---

## Service Layer

### Updated: `src/lib/balance-service.ts`

**New method** (replaces `calculateBalance` for the detail page):

```typescript
async calculateCycleBreakdown(
  userId: string,
  propertyId: string,
  tenantId: string
): Promise<BillingCycleBreakdown>
```

**Logic:**
1. Validate property access
2. Fetch tenant info: `movedInAt`, `monthlyRent` (via `IBalanceRepository.getTenantInfo`)
3. Fetch existing cycles with payment sums via `IBillingCycleRepository.findWithPaymentSums`
4. Generate full timeline: iterate from `(movedInAt.year, movedInAt.month)` to `(now.year, now.month)`
5. For each month in timeline, look up payment sum from step 3
6. Compute `status` and `amountOwed` per month
7. Return `{ tenantId, unpaidCycles: [partial+unpaid, oldest first], allPaid }`

**Keep existing methods** (`calculateBalances`, `getTopOutstandingBalances`) unchanged — they power the dashboard and tenant list badge. These still use the cumulative `IBalanceRepository.getBalanceRows`.

### Updated: `src/lib/payment-service.ts`

Update `createPayment` to:
1. Resolve the target cycle: use `billingCycleId` from input if provided; otherwise FIFO — call `calculateCycleBreakdown` to find the oldest unpaid/partial cycle
2. Call `billingCycleRepo.findOrCreate(tenantId, year, month)` to get/create the cycle
3. Pass `billingCycleId` to `paymentRepo.create`

New constructor parameter: `billingCycleRepo: IBillingCycleRepository`

### Updated: `IBalanceRepository`

Add one new method:
```typescript
getTenantInfo(
  propertyId: string,
  tenantId: string
): Promise<{ monthlyRent: number; movedInAt: Date } | null>;
```

---

## Repository Layer

### New file: `src/lib/repositories/prisma/prisma-billing-cycle-repository.ts`

Implements `IBillingCycleRepository`:
- `findOrCreate`: uses Prisma `upsert` on `(tenantId, year, month)`
- `findWithPaymentSums`: queries `billing_cycle` joined with `payment`, aggregates `SUM(amount)` per cycle

### Updated: `src/lib/repositories/prisma/prisma-balance-repository.ts`

Add `getTenantInfo` implementation — joins `Tenant` with its `Room` to return `monthlyRent` and `movedInAt`.

### Updated: `src/lib/repositories/prisma/prisma-payment-repository.ts`

Update `create` to accept and persist optional `billingCycleId`.

---

## API Layer

### Updated: `GET /api/properties/[propertyId]/tenants/[tenantId]/balance`

**Response shape changes** to return `BillingCycleBreakdown`:
```json
{
  "tenantId": "...",
  "allPaid": false,
  "unpaidCycles": [
    {
      "year": 2025,
      "month": 1,
      "cycleId": null,
      "totalPaid": 0,
      "monthlyRent": 1200000,
      "status": "unpaid",
      "amountOwed": 1200000
    }
  ]
}
```

### New: `GET /api/properties/[propertyId]/tenants/[tenantId]/billing-cycles`

Returns the list of unpaid/partial cycles for a tenant — used by the payment form dropdown.
Same data as `unpaidCycles` in the balance response.

---

## UI Layer

### Updated: `src/components/balance/balance-section.tsx`

Replace cumulative view with per-cycle breakdown:
- If `allPaid`: render `<BalanceStatusIndicator status="paid" />` with "All months paid" label
- If `unpaidCycles.length > 0`: render a list of unpaid/partial cycles
  - Each row: month/year label, `amountOwed`, status badge (`paid`/`partial`/`unpaid`)

### Updated: `src/components/payment/payment-form.tsx`

Add a new `billingPeriod` field:
- Props: `availableCycles?: CycleOption[]` (list of unpaid cycles to show in dropdown), `defaultCycleId?: string`
- `CycleOption = { id: string; label: string }` (e.g. "January 2025")
- Field is hidden if `availableCycles` is not provided or empty

### Updated: `src/app/(app)/properties/[propertyId]/payments/new/page.tsx`

When `tenantId` is in the query param, fetch the billing cycles for that tenant and pass `availableCycles` + `defaultCycleId` to `PaymentForm`.

### Updated: `src/lib/demo-seed.ts`

Replace current payment seeding with billing-cycle-aware version demonstrating 4 scenarios:

| Tenant | Scenario |
|--------|---------|
| Budi Santoso | Fully paid up — all cycles since move-in are `paid` |
| Siti Rahayu | 2 consecutive unpaid months (current + previous) |
| Ahmad Fauzi | Partial payment — paid less than `monthlyRent` for most recent month |
| Dewi Lestari | Skipped a month — paid months 1 and 3, skipped month 2 |

---

## i18n Keys

| Key | EN | ID |
|-----|----|----|
| `balance.cycleBreakdownTitle` | Unpaid months | Bulan yang belum dibayar |
| `balance.allPaid` | All months paid | Semua bulan sudah dibayar |
| `balance.cycle.unpaid` | Unpaid | Belum bayar |
| `balance.cycle.partial` | Partial | Kurang bayar |
| `balance.cycle.amountOwed` | Owed | Sisa |
| `payment.create.billingPeriod` | Billing period | Periode tagihan |
| `payment.create.selectBillingPeriod` | Select billing period | Pilih periode tagihan |

---

## Correctness Properties

1. The generated timeline starts at the first day of the tenant's `movedInAt` month, inclusive.
2. A cycle with `totalPaid >= monthlyRent` is always `paid`; it never appears in `unpaidCycles`.
3. `unpaidCycles` is sorted ascending by `(year, month)` — oldest first.
4. `allPaid` is `true` if and only if `unpaidCycles` is empty.
5. The payment form dropdown shows only unpaid/partial cycles; fully paid cycles are not selectable.
6. Default billing period in the payment form is the first item in the dropdown (oldest unpaid).
7. Recording a payment with a `billingCycleId` that belongs to a different tenant is rejected by the service.
8. Payments without `billingCycleId` (`null`) do not affect per-cycle status calculations.

---

## Backward Compatibility

- The existing `calculateBalances` / `getTopOutstandingBalances` methods on `BalanceService` remain unchanged. They continue to power the tenant list "missing rent" badge and dashboard outstanding balances card.
- The new `calculateCycleBreakdown` is the sole source for the tenant detail balance section.
- Old payments with `billingCycleId = null` are excluded from per-cycle math (they exist only as null in the DB currently).

---

## Trade-offs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Store "empty" cycle rows vs. compute timeline in service | Compute in service | No DB bloat; simpler data model |
| New balance endpoint vs. extend existing | Extend existing (change response shape) | Fewer moving parts; UI already queries this route |
| billingCycleId required vs. optional | Optional | Backward compat; existing payments stay valid |
| Separate API for billing cycles vs. reuse balance route | Separate (for payment form dropdown) | Separation of concerns; balance route returns breakdown, not a list |
