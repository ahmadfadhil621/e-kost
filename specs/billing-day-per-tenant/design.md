# Design — Customisable Billing Day per Tenant

## Schema Change
Add to `tenant` table:
```sql
ALTER TABLE tenant
ADD COLUMN "billingDayOfMonth" INT NULL
CHECK ("billingDayOfMonth" BETWEEN 1 AND 31);
-- null means "use day of movedInAt"
```

## Layer Changes

### 1. Domain (`src/domain/schemas/tenant.ts`)
- Add `billingDayOfMonth: number | null` to `Tenant` interface
- Add `billingDayOfMonth` (optional, z.number().int().min(1).max(31)) to `assignRoomSchema` and `updateTenantSchema`

### 2. Repository Interface (`src/domain/interfaces/tenant-repository.ts`)
- `assignRoom(id, roomId, billingDayOfMonth?: number)` — sets both fields
- `update(id, data)` — include `billingDayOfMonth?: number | null` in partial

### 3. Prisma Repository (`src/lib/repositories/prisma/prisma-tenant-repository.ts`)
- `assignRoom`: persist `billingDayOfMonth` when provided; also set `movedInAt: new Date()`
  - If not provided, default = `new Date().getDate()` (day of assignment)
- `toTenant` mapper: include `billingDayOfMonth`

### 4. Service Layer

#### `src/lib/tenant-service.ts`
- `assignRoom`: accept optional `billingDayOfMonth`; compute default as `new Date().getDate()` before calling repo
- `updateTenant`: allow updating `billingDayOfMonth`

#### `src/lib/balance-service.ts` — `calculateCycleBreakdown`
- `getTenantInfo` returns `billingDayOfMonth: number | null` in addition to `monthlyRent, movedInAt`
- Helper `effectiveBillingDay(billingDayOfMonth, movedInAt)` → `billingDayOfMonth ?? movedInAt.getDate()`
- Helper `clampDay(day, year, month)` → `Math.min(day, daysInMonth(year, month))`
- Cycle iteration: start from the first cycle boundary >= `movedInAt`, step month by month using `billingDay`
- Each cycle label = the month when the cycle **starts**

### 5. Balance Prisma Repository (`src/lib/repositories/prisma/prisma-balance-repository.ts`)
- `getTenantInfo` — include `billingDayOfMonth` in return type and query

### 6. API Route (`src/app/api/properties/[propertyId]/tenants/[tenantId]/assign-room`)
- Accept optional `billingDayOfMonth` in request body

### 7. API Route (`src/app/api/properties/[propertyId]/tenants/[tenantId]` PATCH)
- Accept optional `billingDayOfMonth` in request body

### 8. UI

#### Assign Room Dialog (`src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx`)
- Add optional number input for billing day (1–31), pre-filled with today's date
- Pass to assign-room API

#### Edit Tenant Form (`src/components/tenant/tenant-form.tsx`)
- Add optional number input for billing day (1–31)

#### Balance Section (`src/components/balance/balance-section.tsx`)
- Show "Due on day X of each month" below cycle list

## Cycle Boundary Algorithm

```ts
function clampDay(day: number, year: number, month: number): number {
  return Math.min(day, new Date(year, month, 0).getDate()); // month is 1-based
}

function effectiveBillingDay(billingDayOfMonth: number | null, movedInAt: Date): number {
  return billingDayOfMonth ?? movedInAt.getDate();
}

// Cycles: starting from movedInAt, each cycle runs from
//   [year, month, clampDay(billingDay, year, month)]
// to
//   [nextYear, nextMonth, clampDay(billingDay, nextYear, nextMonth) - 1]
// Label = start month
```

## i18n Keys (en/id)
- `tenant.assignRoom.billingDay` — "Billing Day"
- `tenant.assignRoom.billingDayHint` — "Day of month rent is due (1–31)"
- `tenant.edit.billingDay` — "Billing Day"  
- `billing.cycles.dueDay` — "Due on day {{day}} of each month"
