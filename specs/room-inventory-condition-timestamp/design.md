# Design: Room Inventory Condition Timestamp (Issue #118)

## Schema Change

Add to `room_inventory_item` in Supabase:
```sql
ALTER TABLE room_inventory_item
  ADD COLUMN condition_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE room_inventory_item
  SET condition_updated_at = "createdAt"
  WHERE condition_updated_at = now();
```

> After Supabase confirms the change, run: `npx prisma db pull && npx prisma generate`

Prisma schema addition:
```
conditionUpdatedAt  DateTime  @default(now())
```

## Domain Layer

**`src/domain/schemas/room-inventory-item.ts`**
- Add `conditionUpdatedAt: z.string().datetime()` to `inventoryItemSchema`
- Derived `InventoryItem` type picks it up automatically

## Repository Layer

**`src/lib/repositories/prisma/prisma-room-inventory-item-repository.ts`**
- `mapToItem()`: add `conditionUpdatedAt: row.conditionUpdatedAt.toISOString()`
- `create()`: pass `conditionUpdatedAt: new Date()` to Prisma create
- `update()`: spread `...(input.condition !== undefined && { conditionUpdatedAt: new Date() })` into the data object

## Service Layer

No changes — `conditionUpdatedAt` is managed entirely by the repository.

## API Layer

No changes — route handlers pass through whatever the repository returns.

## UI Layer

**`src/components/room/inventory-section.tsx`** — item card restructure:

Current (flat flex row):
```
[ConditionBadge] [Name ×Qty] [notes] [Edit][Delete]
```

New (left column stacked):
```
[ConditionBadge    ]  [Name ×Qty]           [Edit][Delete]
[tappable timestamp]  [notes (if any)]
```

The tappable timestamp reuses the same `showExact` / `formatDistanceToNow` / `format` pattern from `ActivityEntry`. State is per-item via a dedicated `InventoryItemRow` sub-component that holds its own `showExact` state.

## i18n

New key in `locales/en.json` and `locales/id.json`:
```json
"inventory.conditionRecorded": "Condition recorded"
```

EN: `"Condition recorded"`
ID: `"Kondisi dicatat"`

## Correctness Properties

- `conditionUpdatedAt` is never null
- `conditionUpdatedAt` <= `updatedAt` always (condition update is a subset of general updates)
- Toggling the timestamp display does not trigger a re-fetch
