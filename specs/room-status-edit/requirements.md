# Room Status Edit — Requirements

## Issue
[#99](https://github.com/ahmadfadhil621/e-kost/issues/99) — Move status change into Edit Room, restrict to empty rooms only

## Background
Room status has three values: `available`, `occupied`, `under_renovation`.

`occupied` is **exclusively auto-managed**:
- Set to `occupied` automatically when the first tenant is assigned (`assignRoom`)
- Reverted to `available` automatically when the last tenant moves out (`moveOut`)

Manual status changes should only toggle between `available` and `under_renovation`, and only when the room has no active tenants.

## Current Behaviour
- Room Detail page has an inline Select dropdown allowing status change to any value at any time
- No UI guard prevents changing status while tenants are assigned
- The service does guard against invalid transitions, but the UI exposes all three options

## Expected Behaviour

### Room Detail Page
- Remove the status dropdown entirely
- Keep the `<StatusIndicator>` badge (read-only display)

### Edit Room Form
- Add a "Status" field showing only `available` and `under_renovation`
- If `activeTenantCount === 0`: field is enabled, user can toggle between the two values
- If `activeTenantCount > 0`: field is read-only, shows current status badge + note "Move out all tenants before changing status"

### Service Layer
- `updateRoomStatus` must reject any attempt to manually set status to `occupied` (HTTP 409)
- This enforces that `occupied` is only ever set by the automatic tenant-assignment flow

## Constraints
- No schema changes required
- The PATCH `/status` API endpoint continues to exist and is used by the edit form
- `occupied` must never appear as a selectable option in the UI
- Existing auto-flip logic in `tenant-service.ts` must not be touched
