# Design — Room Available Card Cleanup (issue #103)

## Changes

### `src/components/room/room-card.tsx`

- Remove `onAssignTenant` and `onChangeStatus` from `RoomCardProps` interface
- Remove those props from the function signature
- Remove the entire action section div (border-t block with Assign Tenant + Change Status) from the `available` variant
- Remove unused imports: `UserPlus`, `Wrench`
- Keep `CardContent` with `typeRent` paragraph

### `src/app/(app)/properties/[propertyId]/rooms/page.tsx`

- No changes needed — already doesn't pass those props

## i18n

- Keys `room.card.assignTenant` and `room.card.changeStatus` become unused — leave in locales (cleanup is out of scope)

## Correctness Properties

- PROP 1: For any available room card, the rendered output never contains text matching `assignTenant` or `changeStatus` i18n keys
- PROP 2: The card's wrapping `<a>` href always resolves to `/properties/{propertyId}/rooms/{roomId}`
