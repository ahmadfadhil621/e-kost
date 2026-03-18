# Design: RT-5 — Rent Missing Banner on Tenant Detail

## Overview

This feature modifies the Tenant Detail page in two ways:
1. Removes the "Outstanding Balance" row from `BalanceSection`.
2. Adds a `RentMissingBanner` component near the top of the page that renders only when the balance status is `"unpaid"`.

No backend changes are required. The existing balance API (`GET /api/properties/[propertyId]/tenants/[tenantId]/balance`) already returns `{ status, outstandingBalance, ... }`.

## Architecture

This is a pure UI-layer change. No new API routes, services, or repositories.

```
TenantDetailPage
  ├── <h2> heading
  ├── Tenant info (name, phone, email, room)
  ├── [NEW] RentMissingBanner  ← fetches balance, renders only when unpaid
  ├── Action buttons (assign, move out, edit, back)
  ├── BalanceSection (modified — no outstanding balance row)
  ├── TenantPaymentSection
  └── NotesSection
```

## Components

### 1. RentMissingBanner

**File:** `src/components/balance/rent-missing-banner.tsx`

**Responsibility:** Display a warning banner when the tenant's balance status is `"unpaid"`. Renders null when paid, loading, or when no room is assigned.

**Props:**
```typescript
interface RentMissingBannerProps {
  propertyId: string;
  tenantId: string;
}
```

**Data source:** Shares the same TanStack Query cache key `["balance", propertyId, tenantId]` used by `BalanceSection`, so no duplicate fetch occurs when both components are on the same page.

**Rendered anatomy (when unpaid):**
```
┌─────────────────────────────────────────────────────┐
│  ⚠  Rent missing — Rp 1.500.000 outstanding         │
└─────────────────────────────────────────────────────┘
```
- Background: amber-50 (light) / amber-900 (dark)
- Border: amber-400
- Icon: `AlertTriangle` from lucide-react (aria-hidden)
- Text: `t("balance.rentMissingBanner.message", { amount: "Rp ..." })`
- role="alert" on the root element

**Visibility logic:**
```typescript
if (isLoading || !data || data.status === "paid") return null;
```

### 2. BalanceSection (modified)

**File:** `src/components/balance/balance-section.tsx`

**Change:** Remove the `<div>` row for `balance.outstanding` / `data.outstandingBalance`. Keep monthly rent and total payments rows.

Before → After:
```diff
  <dl className="grid gap-2 text-sm">
    <div>Monthly rent … </div>
    <div>Total payments … </div>
-   <div>Outstanding balance … </div>
  </dl>
```

The `BalanceStatusIndicator` (paid/unpaid badge) remains — it still conveys status at a glance inside the balance card.

### 3. TenantDetailPage (modified)

**File:** `src/app/(app)/properties/[propertyId]/tenants/[tenantId]/page.tsx`

**Change:** Import and mount `RentMissingBanner` between tenant info block and action buttons:

```typescript
import { RentMissingBanner } from "@/components/balance/rent-missing-banner";

// Inside the active-tenant return:
<div className="space-y-6">
  <h2>…</h2>
  <div className="space-y-2">…tenant info…</div>
  <RentMissingBanner propertyId={propertyId} tenantId={tenantId} />  {/* NEW */}
  <div className="flex flex-col gap-2">…action buttons…</div>
  <BalanceSection … />
  …
</div>
```

## i18n Keys

Add to `locales/en.json` under `"balance"`:
```json
"rentMissingBanner": {
  "message": "Rent missing — {{amount}} outstanding"
}
```

Add to `locales/id.json` under `"balance"`:
```json
"rentMissingBanner": {
  "message": "Sewa belum dibayar — {{amount}} tertunggak"
}
```

## Correctness Properties

### Property 1: Banner Visibility Rule

*For any* tenant detail render, the `RentMissingBanner` renders visible content if and only if `data.status === "unpaid"`.

**Validates: Requirements 2.1, 2.5**

### Property 2: Banner Accessibility Encoding

*For any* render of `RentMissingBanner` with `status === "unpaid"`, the rendered output MUST contain:
- An element with `role="alert"`,
- An icon element (aria-hidden),
- A text node with the outstanding amount.

**Validates: Requirements 2.2, 2.3, 3.1**

### Property 3: Outstanding Balance Row Absent

*For any* render of `BalanceSection` with valid data, the rendered output MUST NOT contain the text corresponding to `t("balance.outstanding")`.

**Validates: Requirement 1.1**

### Property 4: Balance Breakdown Preserved

*For any* render of `BalanceSection` with valid data, the rendered output MUST still contain monthly rent and total payments rows.

**Validates: Requirement 1.2**

### Property 5: No Double Fetch

*For any* page that mounts both `RentMissingBanner` and `BalanceSection` with the same `propertyId`/`tenantId`, TanStack Query MUST deduplicate — only one network request is made.

**Validates: Performance (implicit)**

## Error Handling

- **Loading:** Banner renders null while fetching — no flash.
- **No room (400 from API):** `fetchBalance` returns `null`; banner renders null. Requirement 2.6 satisfied.
- **Fetch error:** Banner renders null — failure to show a banner is safer than a broken error state in a secondary component.

## Testing Strategy

### Unit/component tests (Vitest + RTL)

- `RentMissingBanner`: renders null when paid, renders banner when unpaid (contains icon + text + role=alert), renders null when no room, renders null while loading.
- `BalanceSection`: no outstanding balance row in rendered output; monthly rent and total payments rows are still present.

### E2E tests (Playwright — runs in CI)

- Tenant with unpaid balance: banner is visible near page top, contains expected text.
- Tenant with paid balance: banner is absent.
- Mobile viewport 375×667: no horizontal scroll, banner fits.
