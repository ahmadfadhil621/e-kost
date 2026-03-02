# Requirements: Multi-Property Management

## Context & Problem

Property managers often manage more than one rental property (kost). Without multi-property support, all rooms, tenants, payments, and expenses are mixed together in a single flat list, making it impossible to track which data belongs to which property. Managers need a way to create separate properties, switch between them, and scope every downstream data entity to the active property.

## Goals

- Enable managers to create, view, update, and delete properties with name and address
- Provide a property switcher so managers can quickly change the active property context
- Scope all downstream data (rooms, tenants, payments, expenses, notes) to the active property
- Allow property owners to invite staff members who gain access to specific properties
- Deliver a mobile-optimized interface for managing multiple properties on-the-go

## Non-Goals

- Property-level billing or subscription management
- Property photo upload or gallery
- Property-level analytics or reporting (covered by Dashboard feature)
- Property templates or duplication
- Bulk operations across multiple properties simultaneously
- Real-time collaboration or conflict resolution between staff

## Glossary

- **Property**: A physical rental building (kost) with a name, address, and associated rooms/tenants/payments
- **Owner**: The user who created a property; has full CRUD access and can manage staff
- **Staff**: A user granted access to a specific property by its owner; can manage rooms, tenants, payments, and expenses within that property
- **Active Property**: The currently selected property whose data is displayed throughout the application
- **Property Context**: The `propertyId` that scopes all data queries to a single property

## Functional Requirements

### Requirement 1: Property Creation

**User Story:** As a property manager, I want to create a new property with name and address, so that I can manage multiple rental buildings separately.

#### Acceptance Criteria

1. WHEN a manager accesses the property creation interface, THE System SHALL display a form with fields for property name and address
2. WHEN a manager submits a valid property form with all required fields populated, THE System SHALL create a new property record and display a confirmation message
3. WHEN a manager attempts to submit a property form with missing required fields, THE System SHALL prevent submission and display validation errors indicating which fields are required
4. WHEN a property is successfully created, THE System SHALL assign a unique identifier, set the creating user as owner, and record the creation timestamp
5. WHEN a property is created and it is the user's first property, THE System SHALL automatically set it as the active property
6. WHEN a manager creates a property, THE System SHALL persist the property record to the database immediately

### Requirement 2: Property List and Selection

**User Story:** As a property manager, I want to view all my properties and select one to work with, so that I can manage each property's data independently.

#### Acceptance Criteria

1. WHEN a manager accesses the property list, THE System SHALL display all properties where the manager is either owner or assigned staff
2. WHEN a manager views the property list, THE System SHALL display each property showing name, address, and the manager's role (owner or staff)
3. WHEN a manager selects a property from the list, THE System SHALL set that property as the active property and scope all subsequent data views to it
4. WHEN a manager switches the active property, THE System SHALL update the header to show the active property name and redirect to the main dashboard
5. WHEN a manager views the property list on a mobile device, THE System SHALL render properties in a single-column layout with no horizontal scrolling required

### Requirement 3: Property Information Update

**User Story:** As a property owner, I want to update property details when information changes, so that my property records remain accurate.

#### Acceptance Criteria

1. WHEN an owner views a property detail page, THE System SHALL display an edit option to modify property information
2. WHEN an owner edits property fields (name, address) and saves changes, THE System SHALL update the property record and display a confirmation message
3. WHEN an owner saves updated property information, THE System SHALL preserve the unique identifier, creation timestamp, and owner assignment unchanged
4. WHEN an owner updates a property, THE System SHALL record the modification timestamp and persist changes immediately
5. WHEN a staff member views a property detail page, THE System SHALL NOT display edit or delete options (read-only access to property metadata)

### Requirement 4: Property Deletion

**User Story:** As a property owner, I want to delete a property I no longer manage, so that my property list stays current.

#### Acceptance Criteria

1. WHEN an owner views a property detail page, THE System SHALL display a delete option
2. WHEN an owner initiates property deletion, THE System SHALL display a confirmation dialog warning that all associated data (rooms, tenants, payments, expenses) will be affected
3. WHEN an owner confirms deletion, THE System SHALL soft-delete the property by setting a `deletedAt` timestamp
4. WHEN a property is soft-deleted, THE System SHALL remove it from the property list and prevent selection as active property
5. WHEN a property is deleted and it was the active property, THE System SHALL switch the active property to the next available property or show a "create property" prompt if none remain
6. WHEN a staff member views a property, THE System SHALL NOT display the delete option

### Requirement 5: Property Switcher

**User Story:** As a property manager, I want a quick way to switch between properties from any screen, so that I don't have to navigate to a separate property list page.

#### Acceptance Criteria

1. WHEN a manager is on any authenticated screen, THE System SHALL display the active property name in the application header
2. WHEN a manager taps the property name in the header, THE System SHALL open a property switcher (dropdown or bottom sheet) showing all available properties
3. WHEN a manager selects a different property from the switcher, THE System SHALL update the active property context and refresh the current page data
4. WHEN a manager views the property switcher on mobile, THE System SHALL ensure all property items have minimum 44x44px touch targets
5. WHEN only one property exists, THE System SHALL still display the property name in the header but disable the switcher interaction

### Requirement 6: Staff Assignment

**User Story:** As a property owner, I want to invite staff members to help manage my property, so that I can delegate day-to-day management tasks.

#### Acceptance Criteria

1. WHEN an owner views a property's settings, THE System SHALL display a staff management section showing currently assigned staff
2. WHEN an owner initiates a staff invitation, THE System SHALL display a form to enter the staff member's email address
3. WHEN an owner submits a staff invitation for a registered user, THE System SHALL grant that user staff access to the property and display a confirmation
4. WHEN an owner submits a staff invitation for an unregistered email, THE System SHALL display an error indicating the user must register first
5. WHEN an owner views the staff list, THE System SHALL display each staff member's name and email with an option to remove access
6. WHEN an owner removes a staff member, THE System SHALL revoke that user's access to the property immediately
7. WHEN a staff member is removed and they had that property as their active property, THE System SHALL redirect them to their next available property

### Requirement 7: Data Scoping by Property

**User Story:** As a property manager, I want all data (rooms, tenants, payments, expenses) to be automatically scoped to my active property, so that I never see mixed data from different properties.

#### Acceptance Criteria

1. WHEN a manager creates a room, tenant, payment, or expense, THE System SHALL automatically associate it with the active property
2. WHEN a manager views rooms, tenants, payments, or expenses, THE System SHALL display only records belonging to the active property
3. WHEN a manager switches the active property, THE System SHALL refresh all data views to show only the new property's data
4. WHEN an API request is made without a valid property context, THE System SHALL return an error requiring property selection
5. WHEN a user accesses a resource belonging to a property they are not authorized for, THE System SHALL return a 403 Forbidden error

### Requirement 8: Mobile Optimization

**User Story:** As a property manager using a smartphone, I want property management screens optimized for mobile use, so that I can manage properties efficiently while on-site.

#### Acceptance Criteria

1. WHEN a manager accesses any property management screen on a mobile device, THE System SHALL render all content in a single-column layout with no horizontal scrolling required
2. WHEN a manager interacts with property forms on mobile, THE System SHALL display form fields in a vertical stack with adequate spacing
3. WHEN a manager taps interactive elements on property screens, THE System SHALL ensure all buttons and links have minimum 44x44px dimensions
4. WHEN a manager views the property switcher on mobile, THE System SHALL display it as a bottom sheet for easy thumb access
5. WHEN a manager views the interface on screens smaller than 480px width, THE System SHALL maintain readability and usability without requiring pinch-to-zoom

## Constraints

- All property data must be persisted to a database immediately upon creation or modification
- The system must support at least 50 properties per user without performance degradation
- Property records must include a unique identifier that cannot be modified after creation
- All timestamps must be recorded in UTC timezone
- Soft delete for property deletion (set `deletedAt`, never hard delete)
- The interface must function on mobile devices with screen widths from 320px to 480px
- Property names must be non-empty and no longer than 200 characters
- Property addresses must be non-empty and no longer than 500 characters
- All user-facing text must be externalized via translation keys (see cross-cutting-constraints.md)
- Language can be changed by updating a single JSON file without code changes
- All form labels, validation messages, and confirmation dialogs must use translation keys
- Only property owners can edit/delete properties and manage staff
- Staff members have read-only access to property metadata but full access to rooms, tenants, payments, and expenses within the property

## Success Criteria

- A manager can create a new property in fewer than 30 seconds
- A manager can switch between properties in fewer than 3 seconds
- A manager can invite staff to a property in fewer than 20 seconds
- All data views correctly scope to the active property with no data leakage between properties
- Property switcher is accessible from any authenticated screen
- All interactive elements are accessible via touch on mobile devices without requiring zoom
- No property data is lost during any CRUD operation
