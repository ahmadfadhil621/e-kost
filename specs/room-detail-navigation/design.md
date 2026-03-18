# Design: Room Detail Navigation

## Overview

Three changes across the stack to fix room card navigation and enrich the room detail page.

## Change 1: Room Card Component

Remove the `tenantHref` prop from `RoomCard`. The occupied card currently uses `tenantHref ?? roomHref` — after removal, all statuses use `roomHref`.

**Files:** `src/components/room/room-card.tsx`, `src/app/(app)/properties/[propertyId]/rooms/page.tsx`

## Change 2: Room Detail API Enrichment

Enrich `GET /api/properties/{propertyId}/rooms/{roomId}` to include `tenantId` and `tenantName` when the room is occupied.

Reuse the tenant lookup pattern from the rooms list endpoint (`src/app/api/properties/[propertyId]/rooms/route.ts` lines 76-85): fetch all tenants for the property via `tenantService.listTenants`, filter to the one assigned to this room (matching `roomId`, not moved out).

**File:** `src/app/api/properties/[propertyId]/rooms/[roomId]/route.ts`

## Change 3: Room Detail Page UI

Add a "Current Tenant" section to the room detail page, visible only when the room is occupied and `tenantId` is present. The tenant name is rendered as a `<Link>` to the tenant detail page.

**File:** `src/app/(app)/properties/[propertyId]/rooms/[roomId]/page.tsx`

## i18n

Add `room.detail.currentTenant` key to both locale files.

## Decisions

- **No balance on room detail**: User confirmed balance info is not needed here.
- **Reuse list-endpoint pattern**: Fetching all tenants for the property is acceptable for a small landlord app. Avoids adding new repository methods.
