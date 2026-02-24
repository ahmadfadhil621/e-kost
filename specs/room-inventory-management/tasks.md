# Tasks: Room Inventory Management

## 1. Database Setup

- [ ] 1.1 Create room database schema
  - **Description**: Create database table for rooms with fields: id (unique), room_number, room_type, monthly_rent, status, created_at, updated_at
  - **Acceptance Criteria**:
    - Room table created with all required fields
    - Unique identifier auto-generated
    - Room number/identifier unique constraint
    - Status field constrained to: available, occupied, under renovation
    - Timestamps in UTC timezone
    - Default status set to available
  - **Dependencies**: None
  - **Effort**: M
  - **Requirements**: Requirement 1, 2, Constraints

## 2. Backend - Room CRUD Operations

- [ ] 2.1 Implement room creation endpoint
  - **Description**: Create API endpoint to add new room with number, type, and monthly rent
  - **Acceptance Criteria**:
    - POST endpoint accepts room data
    - Validates all required fields (room_number, room_type, monthly_rent)
    - Validates rent is positive number
    - Validates room number is unique
    - Sets initial status to available
    - Returns unique room ID on success
    - Returns validation errors for missing/invalid fields
    - Persists to database immediately
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 1

- [ ] 2.2 Implement room retrieval endpoints
  - **Description**: Create API endpoints to list all rooms and get single room details
  - **Acceptance Criteria**:
    - GET endpoint returns list of all rooms with number, type, rent, and status
    - GET endpoint returns single room with all details
    - Supports filtering by status (available, occupied, under renovation)
    - Returns count of matching rooms when filtered
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 3, 5

- [ ] 2.3 Implement room update endpoint
  - **Description**: Create API endpoint to update room information
  - **Acceptance Criteria**:
    - PUT/PATCH endpoint accepts updated room data
    - Allows updating room_number, room_type, monthly_rent
    - Validates rent is positive number
    - Validates room number uniqueness if changed
    - Preserves status, creation date, and ID
    - Records modification timestamp in UTC
    - Returns validation errors for invalid data (negative rent)
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 4

- [ ] 2.4 Implement room status update endpoint
  - **Description**: Create API endpoint to change room status
  - **Acceptance Criteria**:
    - PUT/PATCH endpoint accepts status change
    - Validates status is one of: available, occupied, under renovation
    - Records status change timestamp in UTC
    - Prevents tenant assignment when status is under renovation
    - Returns confirmation with new status
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 2

## 3. Frontend - Room Management UI

- [ ] 3.1 Create room creation form
  - **Description**: Build mobile-responsive form for adding new rooms
  - **Acceptance Criteria**:
    - Form displays fields for room number, room type, and monthly rent
    - Single-column layout on mobile (320px-480px width)
    - Validates required fields before submission
    - Validates rent is positive number
    - Displays validation errors clearly
    - Shows confirmation message on success
    - Form fields vertically stacked with adequate spacing
  - **Dependencies**: 2.1
  - **Effort**: M
  - **Requirements**: Requirement 1, 6

- [ ] 3.2 Create room list view with card layout
  - **Description**: Build mobile-responsive scrollable card view showing all rooms
  - **Acceptance Criteria**:
    - Displays rooms in scrollable card-based layout
    - Each card shows room number, type, monthly rent, and status
    - Single-column layout with no horizontal scrolling
    - Full-width cards with adequate padding and clear visual separation
    - Visual indicators (color, icon, text label) distinguish status types
    - Minimum 44x44 pixel touch targets for cards
    - Cards are tappable to view details
  - **Dependencies**: 2.2
  - **Effort**: M
  - **Requirements**: Requirement 3, 6

- [ ] 3.3 Create room detail view
  - **Description**: Build mobile-responsive page showing full room details
  - **Acceptance Criteria**:
    - Displays room number, type, monthly rent, and current status
    - Single-column layout on mobile
    - All interactive elements have 44x44 pixel minimum touch targets
    - Provides access to edit and status change actions
  - **Dependencies**: 2.2
  - **Effort**: M
  - **Requirements**: Requirement 3, 6

- [ ] 3.4 Create room edit form
  - **Description**: Build mobile-responsive form for updating room information
  - **Acceptance Criteria**:
    - Pre-populates form with current room data
    - Allows editing room number, type, and monthly rent
    - Single-column layout on mobile
    - Validates rent is positive number
    - Displays validation errors
    - Shows confirmation message on success
    - Preserves status and other data
  - **Dependencies**: 2.3, 3.3
  - **Effort**: M
  - **Requirements**: Requirement 4, 6

- [ ] 3.5 Create room status change interface
  - **Description**: Build mobile-responsive interface for changing room status
  - **Acceptance Criteria**:
    - Displays current status clearly
    - Provides options to select: available, occupied, under renovation
    - Single-column layout on mobile
    - Minimum 44x44 pixel touch targets
    - Shows confirmation message with new status
    - Updates status change timestamp
  - **Dependencies**: 2.4, 3.3
  - **Effort**: M
  - **Requirements**: Requirement 2, 6

- [ ] 3.6 Create room filtering interface
  - **Description**: Build mobile-responsive filter controls for room list
  - **Acceptance Criteria**:
    - Provides filter options: all, available, occupied, under renovation
    - Updates list immediately when filter applied
    - Shows count of matching rooms
    - Single-column layout on mobile
    - Minimum 44x44 pixel touch targets for filter buttons
  - **Dependencies**: 2.2, 3.2
  - **Effort**: S
  - **Requirements**: Requirement 5, 6

## 4. Testing & Validation

- [ ] 4.1 Test room creation workflow
  - **Description**: Verify room creation meets all acceptance criteria
  - **Acceptance Criteria**:
    - Can create room in under 30 seconds
    - All required fields validated
    - Unique ID assigned
    - Initial status set to available
    - Data persisted to database
    - Confirmation displayed
  - **Dependencies**: 3.1
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 4.2 Test room status change workflow
  - **Description**: Verify status changes meet all acceptance criteria
  - **Acceptance Criteria**:
    - Status update reflected within 2 seconds
    - Status change timestamp recorded
    - Confirmation message displayed
    - Room unavailable for assignment when under renovation
  - **Dependencies**: 3.5
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 4.3 Test room filtering functionality
  - **Description**: Verify filtering meets all acceptance criteria
  - **Acceptance Criteria**:
    - Filter results update immediately
    - Count of matching rooms displayed
    - Each filter shows correct subset of rooms
  - **Dependencies**: 3.6
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 4.4 Test room update workflow
  - **Description**: Verify room updates meet all acceptance criteria
  - **Acceptance Criteria**:
    - Changes persisted to database
    - Validation errors displayed for invalid data
    - Status and creation date preserved
    - No data loss during update
  - **Dependencies**: 3.4
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 4.5 Test mobile responsiveness
  - **Description**: Verify all screens work on mobile devices
  - **Acceptance Criteria**:
    - All screens render correctly on 320px-480px width
    - No horizontal scrolling required
    - All touch targets minimum 44x44 pixels
    - No pinch-to-zoom required for readability
    - Single-column layouts maintained
    - Status indicators clearly distinguishable at phone scale
  - **Dependencies**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
  - **Effort**: M
  - **Requirements**: Requirement 6, Success Criteria

- [ ] 4.6 Test performance with 500 rooms
  - **Description**: Verify system handles required room capacity
  - **Acceptance Criteria**:
    - System supports at least 500 room records
    - No performance degradation with full capacity
    - List view remains responsive
    - Filtering remains fast
  - **Dependencies**: 3.2, 3.6
  - **Effort**: S
  - **Requirements**: Constraints

## Open Questions / Assumptions

- **Tech Stack**: Specific technologies (framework, database, language) not defined in requirements
- **Authentication**: Supabase Auth required—all endpoints must verify authenticated session; see user-authentication spec
- **Room Number Format**: No specific format or validation rules for room numbers
- **Room Type Values**: No predefined list of room types specified
- **Currency**: No currency specification for monthly rent display
- **Concurrent Access**: No requirements for handling concurrent updates to same room
- **Status Transitions**: No restrictions on which status changes are allowed (e.g., can occupied go directly to under renovation?)


## 5. Internationalization (i18n)

- [ ] 5.1 Extract and translate room management strings
  - **Description**: Move all UI text to translation keys for room features
  - **Acceptance Criteria**:
    - All form labels translated (room number, type, rent)
    - All validation messages translated
    - All status labels translated (available, occupied, under renovation)
    - All confirmation dialogs translated
    - All success/error messages translated
    - Translation keys follow consistent naming convention
  - **Dependencies**: Tenant i18n setup (6.1 from tenant-room-basics)
  - **Effort**: S
  - **Requirements**: Cross-cutting Constraint 2
