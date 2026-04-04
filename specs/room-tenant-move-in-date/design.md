# Design — Room Tenant Move-In Date (issue #100)

## API Changes

### GET /api/properties/[propertyId]/rooms

**Before (per room in response):**
```json
{
  "tenants": [{ "id": "...", "name": "Jane Doe" }]
}
```

**After:**
```json
{
  "tenants": [{ "id": "...", "name": "Jane Doe", "assignedAt": "2024-01-15T00:00:00.000Z" }],
  "assignedAt": "2024-01-15T00:00:00.000Z"
}
```

- `tenants[n].assignedAt`: ISO string from `tenant.assignedAt`, or null
- Room-level `assignedAt`: minimum (earliest) of all non-null `assignedAt` values in `tenants`; null if all are null or room has no active tenants

## Type Changes

### `RoomForCard` (in `room-card.tsx`)
```typescript
tenants?: { id: string; name: string; assignedAt?: string | null }[];
assignedAt?: string | null;
```

## Name Abbreviation Logic

Function `abbreviateName(name: string): string`:
- Split name by whitespace
- If ≤ 2 words: return as-is
- If ≥ 3 words: first word + abbreviated middles (each: `X.`) + last word
- Examples:
  - `"John"` → `"John"`
  - `"John Doe"` → `"John Doe"`
  - `"George Washington Bush"` → `"George W. Bush"`
  - `"John William Robert Doe"` → `"John W. R. Doe"`

This is a pure function — lives inline in `room-card.tsx`.

## Room Card Occupied Variant

```
┌─────────────────────────────────────┐
│ Room 101                    ✓ Paid  │
│ • Alice N. Tan                      │
│ • Bob W. R. Lim                     │
│ since January 2024                  │
│ Single · Rp1,500,000/mo             │
└─────────────────────────────────────┘
```

- Names rendered as `<ul>` with list-disc style, one `<li>` per tenant
- If only one tenant: still use the list (consistent markup), disc shown
- `assignedAt` rendered below the list using `tenant.detail.since` i18n key
- Date format: `{ month: "long", year: "numeric" }` via `Intl.DateTimeFormat(i18n.language, ...)`

## i18n Keys

| Key | EN | ID |
|-----|----|----|
| `room.card.since` | `"since {{date}}"` | `"sejak {{date}}"` |

## Correctness Properties

1. `abbreviateName` on any string with ≥ 3 words always produces exactly 2 non-abbreviated words (first + last) plus `n-2` single-letter abbreviations
2. Room-level `assignedAt` is always ≤ all individual tenant `assignedAt` values (earliest)
3. `abbreviateName` never produces an empty string for a non-empty input
