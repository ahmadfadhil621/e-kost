# Data Integrity Constraints — Design

> Issue #35

## Changes Required

### 1. API Fix: Move-Out Route (AC-1)

**File:** `src/app/api/properties/[propertyId]/tenants/[tenantId]/move-out/route.ts`

**Problem:** The service throws `"Tenant is already moved out"` but the route only catches `"Tenant not found"` and `"Forbidden"`. Anything else falls through to generic 500.

**Fix:** Add a catch clause for `"Tenant is already moved out"` → return 409.

```
if (err.message === "Tenant is already moved out") → 409 { error: "Tenant is already moved out" }
```

### 2. Service Constraint: Block "Occupied" With No Tenant (AC-2)

**File:** `src/lib/room-service.ts` — `updateRoomStatus()`

**Problem:** Currently only blocks status changes when active tenants ARE present. Does not block setting "occupied" when no tenant is assigned.

**Fix:** Add check before calling `this.repo.updateStatus()`:

```
if (status === "occupied" && activeInRoom.length === 0) {
  throw new Error("Cannot set room to occupied: no active tenant assigned")
}
```

**API route** (`src/app/api/properties/[propertyId]/rooms/[roomId]/status/route.ts`) already catches errors starting with `"Cannot change room status"` — update the catch to also handle the new error message (starts with `"Cannot set room to occupied"`).

### 3. E2E Tests (AC-1, AC-2, AC-3)

**File:** `e2e/data-integrity/data-integrity.spec.ts`

**Scenarios:**
- **Bad** — Move out already-moved-out tenant → UI shows error
- **Bad** — Set room status to "occupied" with no tenant → UI shows error
- **Edge** — Update room monthly rent → tenant balance updates correctly on detail page

## API Contracts

| Route | Change |
|-------|--------|
| `POST /api/.../tenants/[id]/move-out` | Returns 409 `{ error: "Tenant is already moved out" }` |
| `PATCH /api/.../rooms/[id]/status` | Returns 409 for `status=occupied` with no active tenant |

## i18n Keys

No new i18n keys needed — error messages are sourced from API `error` field and displayed via existing toast/error handling.
