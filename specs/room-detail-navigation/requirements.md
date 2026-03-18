# Requirements: Room Detail Navigation

**Source:** [GitHub Issue #20](https://github.com/ahmadfadhil621/e-kost/issues/20) — Room card should navigate to Room Detail page.

## Context & Problem

Clicking an occupied room card on the rooms list navigates to the Tenant Detail page instead of the Room Detail page. Users expect tapping any room card to open that room's detail view regardless of occupancy status.

## Goals

- All room cards (available, occupied, under_renovation) SHALL navigate to the Room Detail page.
- The Room Detail page SHALL display the current tenant's name (as a link to tenant detail) when the room is occupied.

## Non-Goals

- Displaying tenant balance information on the Room Detail page.
- Redesigning the Room Detail page layout.
- Adding new room fields or sections beyond the current tenant name.

## Functional Requirements

### Requirement 1: Consistent Room Card Navigation

**User Story:** As a user, I want to tap any room card and see that room's detail page, so I can view and manage room information directly.

#### Acceptance Criteria

1. WHEN a user taps an available room card, THE System SHALL navigate to `/properties/{propertyId}/rooms/{roomId}`.
2. WHEN a user taps an occupied room card, THE System SHALL navigate to `/properties/{propertyId}/rooms/{roomId}`.
3. WHEN a user taps an under_renovation room card, THE System SHALL navigate to `/properties/{propertyId}/rooms/{roomId}`.

### Requirement 2: Current Tenant Display on Room Detail

**User Story:** As a user viewing an occupied room's detail page, I want to see who currently occupies the room and be able to navigate to their tenant profile.

#### Acceptance Criteria

1. WHEN a user views the detail page of an occupied room with an assigned tenant, THE System SHALL display the tenant's name.
2. WHEN the tenant name is displayed, THE System SHALL render it as a link to `/properties/{propertyId}/tenants/{tenantId}`.
3. WHEN a user views the detail page of a non-occupied room, THE System SHALL NOT display a current tenant section.

### Requirement 3: Room Detail API Enrichment

**User Story:** As the Room Detail page, I need to receive tenant information from the API so I can display it.

#### Acceptance Criteria

1. WHEN the API returns an occupied room with an assigned tenant, the response SHALL include `tenantId` and `tenantName`.
2. WHEN the API returns a non-occupied room, the response SHALL NOT include `tenantId` or `tenantName`.
3. WHEN the API returns an occupied room with no assigned tenant (data inconsistency), the response SHALL return the base room fields without tenant data.
