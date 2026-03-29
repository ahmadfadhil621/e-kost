# Requirements: Property Detail Page
<!-- Traceability: issue #24 -->

**Source:** [GitHub Issue #24](https://github.com/ahmadfadhil621/e-kost/issues/24) — Add Property Detail page.

## Context & Problem

There is no dedicated page for viewing property information and stats. Clicking a property card sends the user to the dashboard; there is no way to navigate directly to property details. P-3 (staff management) also needs a home page to live under.

## Goals

- Provide a dedicated detail page at `/properties/[propertyId]` showing property info and an overview of stats.
- Wire up two entry points: the property list page and the dashboard header.
- Reserve placeholders for map (issue #85) and staff management (P-3 issue #26).

## Non-Goals

- Live map / geocoding → issue #85
- Edit / Archive / Delete property → P-2 issue #27
- Staff management UI → P-3 issue #26

## Functional Requirements

### Requirement 1: Property Info Display

**User Story:** As a user, I want to see my property's name, address, role, and creation date on the detail page.

#### Acceptance Criteria

1. WHEN a user navigates to `/properties/{propertyId}`, THE System SHALL display the property name as a heading.
2. WHEN a user navigates to `/properties/{propertyId}`, THE System SHALL display the property address.
3. WHEN a user navigates to `/properties/{propertyId}`, THE System SHALL display the user's role (owner or staff) as a badge.
4. WHEN a user navigates to `/properties/{propertyId}`, THE System SHALL display the property creation date.

### Requirement 2: Stats Overview

**User Story:** As a user, I want to see a snapshot of key property stats without going to the dashboard.

#### Acceptance Criteria

1. WHEN dashboard data is loaded, THE System SHALL display total room count.
2. WHEN dashboard data is loaded, THE System SHALL display the number of occupied tenants.
3. WHEN dashboard data is loaded, THE System SHALL display the outstanding balance count.
4. WHEN dashboard data fails to load, THE System SHALL show dashes or zeros instead of crashing.

### Requirement 3: Placeholders

**User Story:** As a user, I want to see where the map and staff features will be, even though they are not yet available.

#### Acceptance Criteria

1. WHEN a user views the detail page, THE System SHALL display a map placeholder card labelled "Map coming soon".
2. WHEN a user views the detail page, THE System SHALL display a staff section placeholder labelled "Coming soon".

### Requirement 4: Quick Navigation

**User Story:** As a user, I want quick links to the property's sub-sections from the detail page.

#### Acceptance Criteria

1. WHEN a user views the detail page, THE System SHALL provide a link to `/properties/{propertyId}/rooms`.
2. WHEN a user views the detail page, THE System SHALL provide a link to `/properties/{propertyId}/tenants`.
3. WHEN a user views the detail page, THE System SHALL provide a link to `/properties/{propertyId}/payments`.
4. WHEN a user views the detail page, THE System SHALL provide a link to `/properties/{propertyId}/finance`.

### Requirement 5: Entry Points

**User Story:** As a user, I want to be able to reach the property detail page from the property list and the dashboard.

#### Acceptance Criteria

1. WHEN a user views the property list, THE System SHALL show a "View details" link on each property card.
2. WHEN a user clicks "View details", THE System SHALL navigate to `/properties/{propertyId}`.
3. WHEN a user views the dashboard, THE System SHALL show a "Property info" link near the property name.
4. WHEN a user clicks "Property info", THE System SHALL navigate to `/properties/{activePropertyId}`.

### Requirement 6: Access Control and Error States

**User Story:** As a user, I want informative feedback if a property is inaccessible.

#### Acceptance Criteria

1. WHEN the property fetch returns an error, THE System SHALL display an error message (not crash).
2. WHEN data is loading, THE System SHALL display a loading indicator.
