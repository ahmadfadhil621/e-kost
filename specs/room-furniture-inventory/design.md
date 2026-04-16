# Design: Room Furniture Inventory (Issue #107)

## Architecture

Follows the standard 5-layer architecture: Domain → Repository → Service → API → UI.

### Domain Layer

**`src/domain/schemas/room-inventory-item.ts`**

```typescript
// Enums
export const ItemConditionEnum = z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]);
export type ItemCondition = z.infer<typeof ItemConditionEnum>;

// CRUD schemas
export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  quantity: z.number().int().min(1).max(999),
  condition: ItemConditionEnum,
  notes: z.string().max(500).trim().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const inventoryItemSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  propertyId: z.string(),
  name: z.string(),
  quantity: z.number(),
  condition: ItemConditionEnum,
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

**`src/domain/interfaces/room-inventory-item-repository.ts`**

```typescript
export interface IRoomInventoryItemRepository {
  findByRoom(roomId: string): Promise<InventoryItem[]>;
  findById(id: string): Promise<InventoryItem | null>;
  create(input: CreateInventoryItemInput & { roomId: string; propertyId: string }): Promise<InventoryItem>;
  update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem>;
  delete(id: string): Promise<void>;
}
```

**`src/domain/schemas/activity-log.ts`** (update only — add new enum values)
- Add `INVENTORY_ITEM_ADDED`, `INVENTORY_ITEM_UPDATED`, `INVENTORY_ITEM_REMOVED` to `ActivityActionCodeEnum`
- Add `INVENTORY_ITEM` to `ActivityEntityTypeEnum`
- Add `INVENTORY_ITEM: "rooms"` to `ENTITY_TYPE_TO_AREA`
- Add `INVENTORY_ITEM` to `AREA_TO_ENTITY_TYPES["rooms"]`

### Repository Layer

**`src/lib/repositories/prisma/prisma-room-inventory-item-repository.ts`**

- Implements `IRoomInventoryItemRepository`
- Uses `prisma.room_inventory_item`
- `findByRoom`: `findMany({ where: { roomId }, orderBy: { createdAt: "asc" } })`
- `findById`: `findUnique({ where: { id } })`
- Maps Prisma `Decimal`/`Date` types to domain types before returning

### Service Layer

**`src/lib/room-inventory-item-service.ts`**

```typescript
export class RoomInventoryItemService {
  constructor(
    private repo: IRoomInventoryItemRepository,
    private propertyAccess: IPropertyAccessValidator,
    private logActivity: LogActivityFn
  )

  listItems(userId, propertyId, roomId): Promise<InventoryItem[]>
  addItem(userId, propertyId, roomId, input, actorRole): Promise<InventoryItem>
  updateItem(userId, propertyId, itemId, input, actorRole): Promise<InventoryItem>
  deleteItem(userId, propertyId, itemId, actorRole): Promise<void>
}
```

- All methods call `propertyAccess.validateAccess(userId, propertyId)` first
- `updateItem` and `deleteItem` fetch the item first to verify it belongs to the property
- Activity logging: fire-and-forget after successful mutation

### API Layer

**Routes:**

| Method | Path | Handler |
|--------|------|---------|
| GET    | `/api/properties/[propertyId]/rooms/[roomId]/inventory` | List all items for a room |
| POST   | `/api/properties/[propertyId]/rooms/[roomId]/inventory` | Create item |
| PUT    | `/api/properties/[propertyId]/rooms/[roomId]/inventory/[itemId]` | Update item |
| DELETE | `/api/properties/[propertyId]/rooms/[roomId]/inventory/[itemId]` | Delete item |

All routes:
- Authenticate via `auth.api.getSession()`
- Return `{ data: T }` on success, `{ error: string }` on failure
- POST validates with `createInventoryItemSchema`
- PUT validates with `updateInventoryItemSchema`

### UI Layer

**New components:**

- `src/components/room/condition-badge.tsx` — Colored badge for ItemCondition
- `src/components/room/inventory-item-form.tsx` — Add/edit dialog form
- `src/components/room/inventory-section.tsx` — Full inventory section (list + empty state + add button)

**Room detail page update:**
- Add `<InventorySection propertyId={propertyId} roomId={roomId} isArchived={isArchived} />` between the tenant list and the danger zone

**Condition badge colors** (CSS variables in `globals.css`):

| Condition | CSS var | Light | Dark |
|-----------|---------|-------|------|
| NEW       | `--condition-new` | emerald | emerald |
| GOOD      | `--condition-good` | blue | blue |
| FAIR      | `--condition-fair` | amber | amber |
| POOR      | `--condition-poor` | orange | orange |
| DAMAGED   | `--condition-damaged` | destructive (red) | destructive |

Each condition also has a `--condition-*-foreground` for text contrast.

### i18n Keys

All under `inventory.*` and `condition.*` namespaces:

**`inventory.*`**
- `inventory.title` — "Inventory"
- `inventory.empty` — "No items yet. Add the first item to track what's in this room."
- `inventory.addItem` — "Add item"
- `inventory.editItem` — "Edit item"
- `inventory.deleteItem` — "Remove item"
- `inventory.deleteConfirm` — "Remove this item from the inventory?"
- `inventory.fields.name` — "Item name"
- `inventory.fields.quantity` — "Quantity"
- `inventory.fields.condition` — "Condition"
- `inventory.fields.notes` — "Notes (optional)"
- `inventory.success.added` — "Item added"
- `inventory.success.updated` — "Item updated"
- `inventory.success.deleted` — "Item removed"
- `inventory.namePlaceholder` — "e.g. AC, Wooden desk, Chair"
- `inventory.notesPlaceholder` — "e.g. Samsung AR09, dent on left side"

**`condition.*`**
- `condition.NEW` — "New"
- `condition.GOOD` — "Good"
- `condition.FAIR` — "Fair"
- `condition.POOR` — "Poor"
- `condition.DAMAGED` — "Damaged"

## Correctness Properties

1. Item always belongs to both a room AND a property (both FKs set at creation)
2. Deleting a room cascades to delete its inventory items (DB-level ON DELETE CASCADE)
3. Condition is always a valid enum value — never free text stored in DB
4. Activity log calls never throw — wrapped in fire-and-forget
5. Property access validated on every mutating call
6. `updateItem` / `deleteItem` verify the item's `propertyId` matches the route's `propertyId` to prevent cross-property access

## Query Key Convention

| Operation | Query key |
|-----------|-----------|
| List items | `["inventory", propertyId, roomId]` |
