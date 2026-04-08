# Design: Property Activity Log

## Database Schema

New table required. Must be approved before `prisma/schema.prisma` is edited.

```prisma
enum ActivityEntityType {
  PAYMENT
  EXPENSE
  TENANT
  ROOM
  SETTINGS
}

enum ActivityActionCode {
  // Finance – Payments
  PAYMENT_RECORDED
  PAYMENT_UPDATED
  PAYMENT_DELETED
  // Finance – Expenses
  EXPENSE_CREATED
  EXPENSE_UPDATED
  EXPENSE_DELETED
  // Tenant
  TENANT_ASSIGNED
  TENANT_UNASSIGNED
  TENANT_MOVED
  TENANT_UPDATED
  // Rooms
  ROOM_CREATED
  ROOM_UPDATED
  ROOM_ARCHIVED
  // Settings
  SETTINGS_STAFF_FINANCE_TOGGLED
  SETTINGS_PROPERTY_UPDATED
}

model ActivityLog {
  id          String               @id @default(cuid())
  propertyId  String
  property    Property             @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  actorId     String
  actor       User                 @relation(fields: [actorId], references: [id], onDelete: Cascade)
  actorRole   String               // "owner" | "staff" — denormalized for audit integrity
  actionCode  ActivityActionCode
  entityType  ActivityEntityType
  entityId    String?              // null for settings actions
  metadata    Json                 @default("{}")
  createdAt   DateTime             @default(now())

  @@index([propertyId, createdAt(sort: Desc)])
  @@index([propertyId, actorId])
  @@index([propertyId, entityType])
}
```

> Also add `activityLogs ActivityLog[]` relation to `User` and `Property` models.

---

## Action Codes & metadata shape

| actionCode | entityType | entityId | metadata |
|---|---|---|---|
| PAYMENT_RECORDED | PAYMENT | paymentId | `{ amount, tenantName, roomName }` |
| PAYMENT_UPDATED | PAYMENT | paymentId | `{ amount, tenantName, roomName }` |
| PAYMENT_DELETED | PAYMENT | paymentId | `{ amount, tenantName, roomName }` |
| EXPENSE_CREATED | EXPENSE | expenseId | `{ amount, category }` |
| EXPENSE_UPDATED | EXPENSE | expenseId | `{ amount, category }` |
| EXPENSE_DELETED | EXPENSE | expenseId | `{ amount, category }` |
| TENANT_ASSIGNED | TENANT | tenantId | `{ tenantName, roomName }` |
| TENANT_UNASSIGNED | TENANT | tenantId | `{ tenantName, roomName }` |
| TENANT_MOVED | TENANT | tenantId | `{ tenantName, fromRoom, toRoom }` |
| TENANT_UPDATED | TENANT | tenantId | `{ tenantName }` |
| ROOM_CREATED | ROOM | roomId | `{ roomName }` |
| ROOM_UPDATED | ROOM | roomId | `{ roomName }` |
| ROOM_ARCHIVED | ROOM | roomId | `{ roomName }` |
| SETTINGS_STAFF_FINANCE_TOGGLED | SETTINGS | null | `{ enabled: boolean }` |
| SETTINGS_PROPERTY_UPDATED | SETTINGS | null | `{ fields: string[] }` |

---

## Architecture

### New Files

```
src/domain/interfaces/activity-log-repository.ts   # IActivityLogRepository interface
src/domain/schemas/activity-log.ts                  # Zod schemas + types
src/lib/repositories/prisma/activity-log-repository.ts
src/lib/activity-log-service.ts                     # logActivity() helper + query service
src/app/api/properties/[propertyId]/activity/route.ts  # GET handler
src/app/(app)/properties/[propertyId]/activity/page.tsx
src/components/activity/ActivityFeed.tsx
src/components/activity/ActivityEntry.tsx
src/components/activity/ActivityFilters.tsx
```

### logActivity() Helper

The `logActivity()` helper is a lightweight fire-and-forget function:

```typescript
// src/lib/activity-log-service.ts
export async function logActivity(input: LogActivityInput): Promise<void>
```

Called from **service layer** after a successful mutation, NOT inside a transaction (fire-and-forget to avoid blocking):

```typescript
// Example in PaymentService.createPayment()
const payment = await this.paymentRepo.create(data);
// Fire-and-forget: don't await, don't let failure propagate
logActivity({ propertyId, actorId, actorRole, actionCode: 'PAYMENT_RECORDED', ... }).catch(() => {});
return payment;
```

### Query API

`GET /api/properties/:id/activity?cursor=<cuid>&area=finance&actorId=<id>`

Response:
```json
{
  "data": [
    {
      "id": "clx...",
      "actorId": "clx...",
      "actorName": "Ahmad",
      "actorRole": "staff",
      "actionCode": "PAYMENT_RECORDED",
      "entityType": "PAYMENT",
      "entityId": "clx...",
      "metadata": { "amount": 500000, "tenantName": "Siti", "roomName": "3A" },
      "createdAt": "2026-04-07T12:00:00.000Z"
    }
  ],
  "nextCursor": "clx..."
}
```

Cursor-based pagination: take 21 items, if 21 returned → next page exists, return first 20 + cursor = item[20].id.

---

## UI Design

### Navigation

Add "Activity" tab to property navigation. Icon: `ClockIcon` or `ActivityIcon`.

Route: `/properties/:id/activity`

### Activity Feed Page

```
┌─────────────────────────────────────┐
│ ← Activity                          │
├─────────────────────────────────────┤
│ [All Areas ▾] [All Staff ▾]        │  ← filter bar
├─────────────────────────────────────┤
│ ● Ahmad  [staff]   2 hours ago      │
│   Recorded payment Rp 500.000       │
│   for Siti · Room 3A                │
├─────────────────────────────────────┤
│ ● Budi   [owner]   1 day ago        │
│   Disabled staff-only finance mode  │
├─────────────────────────────────────┤
│         [ Load more ]               │
└─────────────────────────────────────┘
```

- Role badge: small pill — "owner" (primary color) / "staff" (secondary color)
- Timestamp: defaults to relative (`formatDistanceToNow`, date-fns); tapping toggles to exact (`MMM d, yyyy · HH:mm`) and back; styled with an underline dotted border to signal interactivity; toggle state is per-entry local React state
- Action text via i18n key `activity.actions.PAYMENT_RECORDED` with interpolated metadata

### Empty State

```
No activity yet. Actions you and your staff take will appear here.
```

---

## i18n Key Structure

```json
// locales/en.json
{
  "activity": {
    "title": "Activity",
    "empty": "No activity yet",
    "emptyDescription": "Actions you and your staff take will appear here.",
    "loadMore": "Load more",
    "filters": {
      "allAreas": "All Areas",
      "allStaff": "All Staff",
      "finance": "Finance",
      "tenant": "Tenant",
      "rooms": "Rooms",
      "settings": "Settings"
    },
    "roles": {
      "owner": "owner",
      "staff": "staff"
    },
    "actions": {
      "PAYMENT_RECORDED": "Recorded payment {{amount}} for {{tenantName}} · {{roomName}}",
      "PAYMENT_UPDATED": "Updated payment {{amount}} for {{tenantName}} · {{roomName}}",
      "PAYMENT_DELETED": "Deleted payment {{amount}} for {{tenantName}} · {{roomName}}",
      "EXPENSE_CREATED": "Added expense {{category}} {{amount}}",
      "EXPENSE_UPDATED": "Updated expense {{category}} {{amount}}",
      "EXPENSE_DELETED": "Deleted expense {{category}} {{amount}}",
      "TENANT_ASSIGNED": "Assigned {{tenantName}} to {{roomName}}",
      "TENANT_UNASSIGNED": "Unassigned {{tenantName}} from {{roomName}}",
      "TENANT_MOVED": "Moved {{tenantName}} from {{fromRoom}} to {{toRoom}}",
      "TENANT_UPDATED": "Updated tenant details for {{tenantName}}",
      "ROOM_CREATED": "Created room {{roomName}}",
      "ROOM_UPDATED": "Updated room {{roomName}}",
      "ROOM_ARCHIVED": "Archived room {{roomName}}",
      "SETTINGS_STAFF_FINANCE_TOGGLED": "{{enabled, select, true {Enabled} other {Disabled}} staff-only finance mode",
      "SETTINGS_PROPERTY_UPDATED": "Updated property settings"
    }
  }
}
```
