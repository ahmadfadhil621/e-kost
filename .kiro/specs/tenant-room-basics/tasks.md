# Tasks: Tenant & Room Basics (CRUD)

## 1. Project Setup

- [ ] 1.1 Initialize project structure
  - **Description**: Set up basic project structure with folders for backend, frontend, and database
  - **Acceptance Criteria**: 
    - Project structure created with clear separation of concerns
    - Build system configured
  - **Dependencies**: None
  - **Effort**: S

- [ ] 1.2 Set up database schema for tenants and rooms
  - **Description**: Create database tables for tenants with fields: id (unique), name, phone, email, created_at, updated_at, moved_out_at
  - **Acceptance Criteria**:
    - Tenant table created with all required fields
    - Unique identifier auto-generated
    - Timestamps in UTC timezone
    - Soft delete support (moved_out_at field)
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 1, 5, Constraints

## 2. Backend - Tenant CRUD Operations

- [ ] 2.1 Implement tenant creation endpoint
  - **Description**: Create API endpoint to add new tenant with name, phone, and email
  - **Acceptance Criteria**:
    - POST endpoint accepts tenant data
    - Validates all required fields (name, phone, email)
    - Validates email format
    - Returns unique tenant ID on success
    - Returns validation errors for missing/invalid fields
    - Persists to database immediately
  - **Dependencies**: 1.2
  - **Effort**: M
  - **Requirements**: Requirement 1

- [ ] 2.2 Implement tenant retrieval endpoints
  - **Description**: Create API endpoints to list all tenants and get single tenant details
  - **Acceptance Criteria**:
    - GET endpoint returns list of all tenants with name and room assignment
    - GET endpoint returns single tenant with all details (name, phone, email, room, assignment date)
    - Excludes moved-out tenants from active list (or filters appropriately)
  - **Dependencies**: 1.2
  - **Effort**: M
  - **Requirements**: Requirement 3

- [ ] 2.3 Implement tenant update endpoint
  - **Description**: Create API endpoint to update tenant information
  - **Acceptance Criteria**:
    - PUT/PATCH endpoint accepts updated tenant data
    - Validates email format if provided
    - Updates only provided fields (name, phone, email)
    - Preserves room assignment, creation date, and ID
    - Records modification timestamp in UTC
    - Returns validation errors for invalid data
  - **Dependencies**: 1.2
  - **Effort**: M
  - **Requirements**: Requirement 4

- [ ] 2.4 Implement tenant move-out endpoint
  - **Description**: Create API endpoint to mark tenant as moved out
  - **Acceptance Criteria**:
    - POST/PUT endpoint marks tenant as moved out
    - Records move-out date in UTC
    - Removes tenant-room assignment
    - Updates associated room status to available
    - Preserves tenant record (soft delete)
  - **Dependencies**: 1.2
  - **Effort**: M
  - **Requirements**: Requirement 5

## 3. Backend - Room Assignment

- [ ] 3.1 Implement room assignment endpoint
  - **Description**: Create API endpoint to assign tenant to available room
  - **Acceptance Criteria**:
    - POST endpoint accepts tenant ID and room ID
    - Validates room is available (not occupied)
    - Creates tenant-room relationship
    - Updates room status to occupied
    - Records assignment date in UTC
    - Returns error if room already occupied
  - **Dependencies**: 1.2, 2.1
  - **Effort**: M
  - **Requirements**: Requirement 2

## 4. Frontend - Tenant Management UI

- [ ] 4.1 Create tenant creation form
  - **Description**: Build mobile-responsive form for adding new tenants
  - **Acceptance Criteria**:
    - Form displays fields for name, phone, and email
    - Single-column layout on mobile (320px-480px width)
    - Validates required fields before submission
    - Displays validation errors clearly
    - Shows confirmation message on success
    - Form fields vertically stacked with adequate spacing
  - **Dependencies**: 2.1
  - **Effort**: M
  - **Requirements**: Requirement 1, 6

- [ ] 4.2 Create tenant list view
  - **Description**: Build mobile-responsive list showing all tenants
  - **Acceptance Criteria**:
    - Displays scrollable list of tenants
    - Shows tenant name and current room assignment
    - Single-column layout with no horizontal scrolling
    - Full-width cards with clear visual separation
    - Adequate padding for mobile readability
    - Minimum 44x44 pixel touch targets
  - **Dependencies**: 2.2
  - **Effort**: M
  - **Requirements**: Requirement 3, 6

- [ ] 4.3 Create tenant detail view
  - **Description**: Build mobile-responsive page showing full tenant details
  - **Acceptance Criteria**:
    - Displays name, phone, email, assigned room, and assignment date
    - Single-column layout fits on mobile screen without scrolling
    - All interactive elements have 44x44 pixel minimum touch targets
    - Provides access to edit and move-out actions
  - **Dependencies**: 2.2
  - **Effort**: M
  - **Requirements**: Requirement 3, 6

- [ ] 4.4 Create tenant edit form
  - **Description**: Build mobile-responsive form for updating tenant information
  - **Acceptance Criteria**:
    - Pre-populates form with current tenant data
    - Allows editing name, phone, and email
    - Single-column layout on mobile
    - Validates email format
    - Displays validation errors
    - Shows confirmation message on success
    - Preserves room assignment and other data
  - **Dependencies**: 2.3, 4.3
  - **Effort**: M
  - **Requirements**: Requirement 4, 6

- [ ] 4.5 Create room assignment interface
  - **Description**: Build mobile-responsive interface for assigning tenant to room
  - **Acceptance Criteria**:
    - Displays list of available rooms only
    - Single-column layout on mobile
    - Minimum 44x44 pixel touch targets
    - Shows confirmation on successful assignment
    - Displays error if room already occupied
  - **Dependencies**: 3.1, 4.3
  - **Effort**: M
  - **Requirements**: Requirement 2, 6

- [ ] 4.6 Create move-out confirmation dialog
  - **Description**: Build confirmation dialog for tenant move-out
  - **Acceptance Criteria**:
    - Displays confirmation dialog before move-out
    - Prevents accidental removal
    - Shows success message after move-out
    - Updates room status to available in UI
  - **Dependencies**: 2.4, 4.3
  - **Effort**: S
  - **Requirements**: Requirement 5, 6

## 5. Testing & Validation

- [ ] 5.1 Test tenant creation workflow
  - **Description**: Verify tenant creation meets all acceptance criteria
  - **Acceptance Criteria**:
    - Can create tenant in under 30 seconds
    - All required fields validated
    - Unique ID assigned
    - Data persisted to database
    - Confirmation displayed
  - **Dependencies**: 4.1
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 5.2 Test room assignment workflow
  - **Description**: Verify room assignment meets all acceptance criteria
  - **Acceptance Criteria**:
    - Can assign tenant to room in under 20 seconds
    - Only available rooms shown
    - Room status updates to occupied
    - Assignment date recorded
    - Error shown for occupied rooms
  - **Dependencies**: 4.5
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 5.3 Test tenant update workflow
  - **Description**: Verify tenant updates meet all acceptance criteria
  - **Acceptance Criteria**:
    - Changes persisted within 2 seconds
    - Room assignment preserved
    - Validation errors displayed for invalid data
    - No data loss during update
  - **Dependencies**: 4.4
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 5.4 Test move-out workflow
  - **Description**: Verify move-out meets all acceptance criteria
  - **Acceptance Criteria**:
    - Room status changes to available within 2 seconds
    - Tenant record preserved in database
    - Confirmation dialog prevents accidental removal
  - **Dependencies**: 4.6
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 5.5 Test mobile responsiveness
  - **Description**: Verify all screens work on mobile devices
  - **Acceptance Criteria**:
    - All screens render correctly on 320px-480px width
    - No horizontal scrolling required
    - All touch targets minimum 44x44 pixels
    - No pinch-to-zoom required for readability
    - Single-column layouts maintained
  - **Dependencies**: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
  - **Effort**: M
  - **Requirements**: Requirement 6, Success Criteria

## Open Questions / Assumptions

- **Tech Stack**: Specific technologies (framework, database, language) not defined in requirements
- **Authentication**: No authentication or authorization requirements specified
- **Room Data**: Assumes room data structure exists (referenced in room-inventory-management spec)
- **Validation Rules**: Phone number format validation not specified
- **Concurrent Access**: No requirements for handling concurrent updates to same tenant
- **Data Migration**: No requirements for importing existing tenant data
