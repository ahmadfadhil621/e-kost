# Tasks: Room Inventory Condition Timestamp (Issue #118)

## 0. Schema Change (requires user action in Supabase)

- [ ] 0.1 User adds `condition_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` to `room_inventory_item` in Supabase and backfills existing rows to `createdAt`
- [ ] 0.2 Run `npx prisma db pull && npx prisma generate` to sync Prisma client
- [ ] 0.3 Restart dev server

## 1. Domain Layer

- [ ] 1.1 Add `conditionUpdatedAt: z.string().datetime()` to `inventoryItemSchema` in `src/domain/schemas/room-inventory-item.ts`

## 2. Repository Layer

- [ ] 2.1 Update `mapToItem()` in `PrismaRoomInventoryItemRepository` to include `conditionUpdatedAt`
- [ ] 2.2 Set `conditionUpdatedAt: new Date()` in `create()`
- [ ] 2.3 Conditionally set `conditionUpdatedAt: new Date()` in `update()` when `input.condition !== undefined`

## 3. Service Layer

- [ ] (no changes needed)

## 4. API Layer

- [ ] (no changes needed — field passes through automatically)

## 5. UI Layer

- [ ] 5.1 Extract `InventoryItemRow` sub-component from `InventorySection` item list render
- [ ] 5.2 Add `showExact` state to `InventoryItemRow` for tappable timestamp toggle
- [ ] 5.3 Display `inventory.conditionRecorded` label + tappable timestamp below condition badge

## 6. i18n

- [ ] 6.1 Add `inventory.conditionRecorded` to `locales/en.json`
- [ ] 6.2 Add `inventory.conditionRecorded` to `locales/id.json`

## 7. Tests

- [ ] 7.1 Vitest: repository unit tests (conditionUpdatedAt set on create, updated on condition change, unchanged otherwise)
- [ ] 7.2 Vitest: domain schema parses conditionUpdatedAt
- [ ] 7.3 E2E: add item → condition recorded timestamp visible
- [ ] 7.4 E2E: edit item with condition change → timestamp updates
- [ ] 7.5 E2E: edit item without condition change → timestamp unchanged
- [ ] 7.6 E2E: tappable toggle between relative and absolute
