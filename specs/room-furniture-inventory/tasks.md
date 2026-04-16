# Tasks: Room Furniture Inventory (Issue #107)

## 1. Domain Layer

- [ ] 1.1 Define `inventoryItemSchema`, `createInventoryItemSchema`, `updateInventoryItemSchema`, `ItemConditionEnum` in `src/domain/schemas/room-inventory-item.ts`
- [ ] 1.2 Define `IRoomInventoryItemRepository` interface in `src/domain/interfaces/room-inventory-item-repository.ts`
- [ ] 1.3 Update `src/domain/schemas/activity-log.ts` — add INVENTORY_ITEM_ADDED / INVENTORY_ITEM_UPDATED / INVENTORY_ITEM_REMOVED to `ActivityActionCodeEnum`; add INVENTORY_ITEM to `ActivityEntityTypeEnum`; update area maps

## 2. Repository Layer

- [ ] 2.1 Implement `PrismaRoomInventoryItemRepository` in `src/lib/repositories/prisma/prisma-room-inventory-item-repository.ts`

## 3. Service Layer

- [ ] 3.1 Implement `RoomInventoryItemService` in `src/lib/room-inventory-item-service.ts`

## 4. API Layer

- [ ] 4.1 GET/POST `/api/properties/[propertyId]/rooms/[roomId]/inventory/route.ts`
- [ ] 4.2 PUT/DELETE `/api/properties/[propertyId]/rooms/[roomId]/inventory/[itemId]/route.ts`

## 5. UI Layer

- [ ] 5.1 Add `--condition-*` CSS variables to `src/app/globals.css`
- [ ] 5.2 Create `src/components/room/condition-badge.tsx`
- [ ] 5.3 Create `src/components/room/inventory-item-form.tsx` (add/edit dialog)
- [ ] 5.4 Create `src/components/room/inventory-section.tsx`
- [ ] 5.5 Update room detail page to render `<InventorySection />`

## 6. i18n

- [ ] 6.1 Add `inventory.*` and `condition.*` keys to `locales/en.json` and `locales/id.json`

## 7. Tests

- [ ] 7.1 Vitest: service unit tests
- [ ] 7.2 Vitest: API route tests
- [ ] 7.3 E2E: add/edit/delete item flows
