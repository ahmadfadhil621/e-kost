# Tasks — Room Tenant Move-In Date (issue #100)

## Layer 1: API

- [ ] In `route.ts` GET handler: add `assignedAt` to each tenant object in `tenantsByRoomId`
- [ ] In `route.ts` GET handler: compute room-level `assignedAt` = earliest across tenants; include in response

## Layer 2: Type

- [ ] Add `tenants?: { id: string; name: string; assignedAt?: string | null }[]` to `RoomForCard`
- [ ] Add `assignedAt?: string | null` to `RoomForCard`

## Layer 3: UI

- [ ] Add `abbreviateName(name: string): string` pure function in `room-card.tsx`
- [ ] Update occupied card variant to render `tenants` as `<ul>` with abbreviated names
- [ ] Render `assignedAt` below names using `room.card.since` i18n key

## Layer 4: i18n

- [ ] Add `room.card.since` to `locales/en.json`
- [ ] Add `room.card.since` to `locales/id.json`

## Tests

- [ ] Route test: `GET` returns `assignedAt` on each tenant and room-level `assignedAt`
- [ ] Route test: multi-tenant room returns earliest `assignedAt` as room-level field
- [ ] Route test: room with no tenants has `assignedAt: null`
- [ ] Room card test: renders tenant names as list items with abbreviation
- [ ] Room card test: renders `since` date for occupied room with `assignedAt`
- [ ] Room card test: omits date when `assignedAt` is null
- [ ] Room card test: available and under_renovation cards unaffected
- [ ] E2E: occupied room card shows tenant name and formatted move-in date
