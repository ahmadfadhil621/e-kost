# Requirements: Room Inventory Condition Timestamp (Issue #118)

## Problem
`updatedAt` on inventory items tracks any field change. Landlords need to know exactly when an item's **condition** was last assessed — not when notes or quantity changed. This matters for move-out dispute resolution.

## Acceptance Criteria

### AC-1: conditionUpdatedAt is set on item creation
- When an inventory item is created, `conditionUpdatedAt` is set to the creation timestamp
- The value is never null

### AC-2: conditionUpdatedAt updates only on condition change
- When an item is updated and the `condition` field is included in the payload, `conditionUpdatedAt` is updated to the current timestamp
- When an item is updated and `condition` is NOT in the payload, `conditionUpdatedAt` is unchanged

### AC-3: Existing rows are backfilled
- For rows that existed before this column was added, `conditionUpdatedAt` defaults to `createdAt` (never null)

### AC-4: conditionUpdatedAt is exposed in the API response
- GET /inventory and POST /inventory responses include `conditionUpdatedAt` as an ISO string
- PUT /inventory/[itemId] response includes updated `conditionUpdatedAt`

### AC-5: UI shows "Condition recorded" below the condition badge
- Each inventory item card displays a tappable timestamp below the condition badge
- Default display: relative time (e.g., "3 days ago")
- Tapping toggles to absolute format (e.g., "Apr 15, 2026 · 14:30")
- Tapping again returns to relative time
- Label text is i18n-keyed

## Out of Scope
- Full condition history (that lives in the activity log — issue #107)
- Deriving condition-change date from the activity log at query time
