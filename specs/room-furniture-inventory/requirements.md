# Requirements: Room Furniture Inventory (Issue #107)

## Context & Problem

Landlords have no record of what furniture and fixtures are in each room. When tenants move out, there's no proof of what was there or what condition it was in — leading to disputes over missing or damaged items. Landlords need a simple per-room inventory list they can update throughout a tenancy.

## Goals

- Allow landlords to maintain a list of items (furniture, fixtures) per room
- Track item name, quantity, condition, and optional notes
- Show the inventory on the room detail page with scannable condition badges
- Log inventory changes (add/update/remove) to the activity log
- Support i18n for all UI strings and condition labels

## Non-Goals (v1)

- Photo attachments per item
- Move-in/move-out inventory snapshots
- Tenant-visible inventory
- Bulk import/export
- Item templates or presets

## Glossary

- **Inventory item**: A single furniture or fixture entry for a room (e.g. "AC", "Wooden desk")
- **Condition**: An enum value indicating item state: NEW, GOOD, FAIR, POOR, DAMAGED
- **Inventory section**: The inline section on the room detail page displaying the item list

## Functional Requirements

### Requirement 1: View Inventory

**User Story:** As a landlord, I want to see all items in a room so I can review its contents at a glance.

#### Acceptance Criteria

1. WHEN a manager views a room detail page, THE System SHALL display an "Inventory" section listing all items for that room
2. WHEN the inventory is empty, THE System SHALL display an empty state message and a prompt to add the first item
3. WHEN items exist, THE System SHALL display each item's name, quantity, condition badge, and notes (if any)
4. THE System SHALL display condition as a colored badge (not plain text) for scannability
5. THE System SHALL fetch inventory via TanStack Query with loading and error states

### Requirement 2: Add Item

**User Story:** As a landlord, I want to add a new item to a room's inventory so I can document what's in the room.

#### Acceptance Criteria

1. WHEN a manager taps "Add item", THE System SHALL open an inline form or dialog with fields: name (required), quantity (required, min 1), condition (required, enum select), notes (optional)
2. WHEN a manager submits a valid form, THE System SHALL create the item, close the form, and refresh the inventory list
3. WHEN a manager submits with missing required fields, THE System SHALL prevent submission and show validation errors
4. WHEN the item is created, THE System SHALL log an INVENTORY_ITEM_ADDED activity entry
5. THE System SHALL show a success toast after creation

### Requirement 3: Edit Item

**User Story:** As a landlord, I want to update an item's details (especially condition) so I can reflect changes during a tenancy.

#### Acceptance Criteria

1. WHEN a manager taps an item's edit action, THE System SHALL open a pre-populated form with current values
2. WHEN a manager saves changes, THE System SHALL update the item, close the form, and refresh the list
3. WHEN a manager saves with invalid data, THE System SHALL prevent submission and show validation errors
4. WHEN the item is updated, THE System SHALL log an INVENTORY_ITEM_UPDATED activity entry with metadata including previous and new condition
5. THE System SHALL show a success toast after update

### Requirement 4: Delete Item

**User Story:** As a landlord, I want to remove an item from the inventory when it's no longer in the room.

#### Acceptance Criteria

1. WHEN a manager taps the delete action on an item, THE System SHALL ask for confirmation before deleting
2. WHEN a manager confirms deletion, THE System SHALL remove the item and refresh the list
3. WHEN the item is deleted, THE System SHALL log an INVENTORY_ITEM_REMOVED activity entry
4. THE System SHALL show a success toast after deletion

### Requirement 5: Mobile Optimization

#### Acceptance Criteria

1. THE System SHALL render the inventory section in a single-column layout on mobile (320px–480px)
2. All interactive elements SHALL have minimum 44×44px touch targets
3. Condition badges SHALL be clearly distinguishable at phone scale

## Constraints

- Inventory belongs to the room, not the tenant — items persist across tenant changes
- Condition MUST be an enum (NEW, GOOD, FAIR, POOR, DAMAGED), never free text
- Activity log integration is required (fire-and-forget, never blocks primary action)
- All user-facing strings must use i18n translation keys
- Archived rooms: inventory section is visible (read-only is acceptable) but add/edit/delete may be disabled
