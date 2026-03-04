# Tasks: Room Inventory Management

## 1. Domain Layer

- [x] 1.1 Define Room entity and validation schemas
  - **Description**: Create shared Zod schemas for room CRUD and TypeScript interfaces for Room and RoomStatus
  - **Acceptance Criteria**:
    - `createRoomSchema` validates roomNumber (1-50 chars, required, trimmed), roomType (1-100 chars, required, trimmed), monthlyRent (positive number, required)
    - `updateRoomSchema` validates partial updates with at least one field
    - `updateRoomStatusSchema` validates status is one of: available, occupied, under_renovation
    - TypeScript interfaces for Room, RoomStatus, CreateRoomInput, UpdateRoomInput
  - **Dependencies**: None
  - **Effort**: S

- [x] 1.2 Define IRoomRepository interface
  - **Description**: Create repository interface for room data access
  - **Acceptance Criteria**:
    - Methods: create, findById, findByProperty, update, updateStatus
    - findByProperty supports optional status filter and returns count
    - All methods return typed promises
    - Room number uniqueness enforced within a property
  - **Dependencies**: 1.1
  - **Effort**: S

## 2. Service Layer

- [x] 2.1 Implement RoomService
  - **Description**: Build service layer with business logic for room CRUD and status management
  - **Acceptance Criteria**:
    - `createRoom` validates data, enforces room number uniqueness within property, sets initial status to available
    - `getRoom` validates property access and returns room
    - `listRooms` returns rooms for property with optional status filter and count
    - `updateRoom` validates property access, enforces room number uniqueness if changed, preserves status/id/createdAt
    - `updateRoomStatus` validates property access, updates status and records timestamp
    - All operations validate property access via PropertyService
  - **Dependencies**: 1.2
  - **Effort**: L

- [x] 2.2 Write unit tests for RoomService
  - **Description**: Test all room business logic
  - **Acceptance Criteria**:
    - Tests for creation (valid data, missing fields, duplicate room number, negative rent, initial status)
    - Tests for listing (all rooms, filter by status, count accuracy, empty list)
    - Tests for update (valid, invalid data, uniqueness, preserve invariants)
    - Tests for status update (valid transitions, invalid status values)
    - Property-based tests for correctness properties
    - Minimum 20 tests
  - **Dependencies**: 2.1
  - **Effort**: L

## 3. Data Layer

- [x] 3.1 Verify Prisma schema for Room
  - **Description**: Ensure Room model exists in Prisma schema with correct fields, indexes, and relations
  - **Acceptance Criteria**:
    - Room model: id, propertyId, roomNumber, roomType, monthlyRent, status, createdAt, updatedAt
    - Unique constraint on (propertyId, roomNumber)
    - Index on (propertyId, status) for efficient filtered queries
    - Relation to Property model
    - Status defaults to 'available'
  - **Dependencies**: None (Phase 0 creates schema)
  - **Effort**: S

- [x] 3.2 Implement PrismaRoomRepository
  - **Description**: Implement IRoomRepository using Prisma client
  - **Acceptance Criteria**:
    - All interface methods implemented
    - findByProperty filters by propertyId, supports optional status filter
    - Room number uniqueness scoped to propertyId
    - Status constraint enforced (available, occupied, under_renovation)
    - Proper error handling for not-found and constraint violations
  - **Dependencies**: 1.2, 3.1
  - **Effort**: M

## 4. API Layer

- [x] 4.1 Implement room CRUD API routes
  - **Description**: Create REST endpoints for room management scoped to a property
  - **Acceptance Criteria**:
    - POST /api/properties/[propertyId]/rooms — create room (authenticated, property access validated)
    - GET /api/properties/[propertyId]/rooms — list rooms with optional ?status= filter (authenticated)
    - GET /api/properties/[propertyId]/rooms/[roomId] — get room detail (authenticated)
    - PUT /api/properties/[propertyId]/rooms/[roomId] — update room info (authenticated)
    - PATCH /api/properties/[propertyId]/rooms/[roomId]/status — update room status (authenticated)
    - Property access middleware applied to all routes
    - Input validation with Zod schemas
    - Consistent JSON error responses with appropriate status codes (400, 404, 409)
  - **Dependencies**: 2.1, 3.2
  - **Effort**: L

- [x] 4.2 Write API route tests
  - **Description**: Test all room API endpoints
  - **Acceptance Criteria**:
    - Tests for each endpoint: success cases, validation errors, not found, unauthorized
    - Tests for room number uniqueness (409 Conflict)
    - Tests for property access middleware enforcement
    - Minimum 15 tests
  - **Dependencies**: 4.1
  - **Effort**: M

## 5. UI Layer

- [x] 5.1 Create RoomForm component
  - **Description**: Build mobile-responsive form for creating and editing rooms
  - **Acceptance Criteria**:
    - Fields: room number (text), room type (text), monthly rent (number)
    - Supports create and edit modes via props
    - Client-side validation with React Hook Form + Zod
    - Mobile-optimized: single column, 44x44px touch targets, vertical stack with adequate spacing
    - Loading state on submission
    - Success/error feedback via toast
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [x] 5.2 Create RoomList page
  - **Description**: Build page showing all rooms for the active property in a card layout
  - **Acceptance Criteria**:
    - Card layout showing room number, type, monthly rent, status indicator
    - Single-column layout on mobile, full-width cards
    - Status filter buttons (All, Available, Occupied, Under Renovation) with match counts
    - Tap card to view room detail
    - Loading and empty states
    - Fetches rooms via TanStack Query
    - All text via translation keys
  - **Dependencies**: 4.1, 5.3, 5.5
  - **Effort**: M

- [x] 5.3 Create RoomCard component
  - **Description**: Build individual room display card for list view
  - **Acceptance Criteria**:
    - Full-width card with room number, type, rent, status indicator
    - Status indicator uses color + icon + text label (not color alone)
    - Minimum 44x44px height for touch interaction
    - Clear visual separation between cards
    - All text via translation keys
  - **Dependencies**: 5.5
  - **Effort**: S

- [x] 5.4 Create RoomDetail page
  - **Description**: Build room detail view with edit and status change actions
  - **Acceptance Criteria**:
    - Displays room number, type, monthly rent, current status, creation date
    - Edit and Change Status action buttons
    - Status change via dropdown with three options
    - Confirmation message after status update
    - Mobile-optimized single-column layout
    - All text via translation keys
  - **Dependencies**: 4.1, 5.1
  - **Effort**: M

- [x] 5.5 Create StatusIndicator component
  - **Description**: Build reusable status indicator for room status
  - **Acceptance Criteria**:
    - Color + icon + text label for each status (available, occupied, under renovation)
    - Accessible: does not rely on color alone
    - Supports small (list) and large (detail) sizes
    - Clearly visible at phone scale
    - Uses CSS variables for colors (not hardcoded)
    - All text via translation keys
  - **Dependencies**: None
  - **Effort**: S

- [x] 5.6 Create StatusFilter component
  - **Description**: Build status filter controls for room list
  - **Acceptance Criteria**:
    - Four buttons: All, Available, Occupied, Under Renovation
    - Active filter visually highlighted
    - Shows count of rooms matching each filter
    - 44x44px minimum button size
    - All text via translation keys
  - **Dependencies**: None
  - **Effort**: S

## 6. Internationalization (i18n)

- [x] 6.1 Extract and translate room management strings
  - **Description**: Add all room management UI text to translation files
  - **Acceptance Criteria**:
    - All form labels, buttons, messages in en.json and id.json
    - Translation keys follow `room.*` naming convention
    - Validation messages translated
    - Status labels translated (available, occupied, under renovation)
    - Confirmation dialogs translated
    - Filter labels translated
  - **Dependencies**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
  - **Effort**: S

## 7. Testing & Validation

- [ ] 7.1 Test room CRUD workflow
  - **Description**: Verify room creation, update, and status changes
  - **Acceptance Criteria**:
    - Can create room in under 30 seconds
    - Room appears in list after creation with status "available"
    - Room update persists correctly
    - Status update reflected within 2 seconds
    - Room number uniqueness enforced
  - **Dependencies**: 5.2, 5.4
  - **Effort**: S

- [ ] 7.2 Test room filtering
  - **Description**: Verify filtering rooms by status
  - **Acceptance Criteria**:
    - Filter results update immediately
    - Count matches number of displayed rooms
    - Each filter shows correct subset
  - **Dependencies**: 5.2
  - **Effort**: S

- [ ] 7.3 Test mobile responsiveness
  - **Description**: Verify all room screens work on mobile
  - **Acceptance Criteria**:
    - All screens render at 320px-480px without horizontal scroll
    - All touch targets minimum 44x44px
    - Status indicators clearly distinguishable at phone scale
    - Cards and forms display correctly on mobile
  - **Dependencies**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
  - **Effort**: M

- [ ] 7.4 Test performance with 500 rooms
  - **Description**: Verify system handles required room capacity
  - **Acceptance Criteria**:
    - List view remains responsive with 500 rooms
    - Filtering remains fast
    - No performance degradation
  - **Dependencies**: 5.2
  - **Effort**: S

## Progress Note

TDD steps 1–3 complete. Domain, service, PrismaRoomRepository, API, RoomForm, RoomList, RoomCard, RoomDetail, StatusFilter, StatusIndicator, and i18n (en.json, id.json) are implemented. Remaining: 7.x manual validation (CRUD workflow, filtering, mobile, performance).

## Open Questions / Assumptions

- **Room Number Format**: No specific format or validation rules for room numbers — free-text within 50 characters.
- **Room Type Values**: No predefined list of room types — free-text within 100 characters.
- **Status Transitions**: No restrictions on which status changes are allowed (e.g., occupied can go directly to under renovation). Post-MVP enhancement.
- **Concurrent Access**: Last write wins for MVP. Optimistic locking with `updatedAt` is a post-MVP enhancement.
- **Property Scoping**: All room operations are scoped to the active property via `propertyId` in the URL path and validated by property access middleware.
