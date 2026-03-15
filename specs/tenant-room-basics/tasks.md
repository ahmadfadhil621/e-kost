# Tasks: Tenant & Room Basics (CRUD)

## 1. Domain Layer

- [x] 1.1 Define Tenant entity and validation schemas
  - **Description**: Create shared Zod schemas for tenant CRUD and TypeScript interfaces for Tenant
  - **Acceptance Criteria**:
    - `createTenantSchema` validates name (1-100 chars, required), phone (required), email (valid format, required)
    - `updateTenantSchema` validates partial updates with at least one field, email format if provided
    - `assignRoomSchema` validates roomId (required, valid UUID)
    - TypeScript interfaces for Tenant, CreateTenantInput, UpdateTenantInput
  - **Dependencies**: None
  - **Effort**: S

- [x] 1.2 Define ITenantRepository interface
  - **Description**: Create repository interface for tenant data access
  - **Acceptance Criteria**:
    - Methods: create, findById, findByProperty, update, softDelete (move-out)
    - findByProperty supports filtering active vs moved-out tenants
    - Room assignment methods: assignRoom, removeRoomAssignment
    - All methods return typed promises
  - **Dependencies**: 1.1
  - **Effort**: S

## 2. Service Layer

- [x] 2.1 Implement TenantService
  - **Description**: Build service layer with business logic for tenant CRUD and room assignment
  - **Acceptance Criteria**:
    - `createTenant` validates data and associates tenant with active property
    - `getTenant` validates property access and returns tenant with room details
    - `listTenants` returns tenants for property, excludes moved-out by default
    - `updateTenant` validates property access, preserves room assignment/id/createdAt
    - `moveOut` soft-deletes tenant (sets movedOutAt), frees room (sets status to available), records move-out date
    - All operations validate property access via PropertyService
  - **Dependencies**: 1.2
  - **Effort**: L

- [x] 2.2 Implement room assignment in TenantService
  - **Description**: Add room assignment and validation business logic
  - **Acceptance Criteria**:
    - `assignRoom` validates room is available (not occupied, not under renovation), links tenant to room, updates room status to occupied
    - Assignment is transactional (tenant + room update in single transaction)
    - Prevents assigning tenant who already has a room (must unassign first or move out)
    - Records assignment date in UTC
    - Appropriate errors: 404 (room not found), 409 (room occupied)
  - **Dependencies**: 2.1
  - **Effort**: M

- [x] 2.3 Write unit tests for TenantService
  - **Description**: Test all tenant and room assignment business logic
  - **Acceptance Criteria**:
    - Tests for creation (valid data, missing fields, email validation)
    - Tests for listing (active only, include moved-out, empty)
    - Tests for update (valid, invalid email, preserve invariants)
    - Tests for move-out (soft delete, room freed, tenant preserved)
    - Tests for room assignment (valid, occupied room blocked, under renovation blocked)
    - Property-based tests for correctness properties
    - Minimum 20 tests
  - **Dependencies**: 2.1, 2.2
  - **Effort**: L

## 3. Data Layer

- [x] 3.1 Verify Prisma schema for Tenant
  - **Description**: Ensure Tenant model exists in Prisma schema with correct fields, indexes, and relations
  - **Acceptance Criteria**:
    - Tenant model: id, propertyId, name, phone, email, roomId (nullable), assignedAt (nullable), createdAt, updatedAt, movedOutAt (nullable)
    - Index on propertyId for efficient property-scoped queries
    - Relation to Property, Room models
    - movedOutAt field supports soft delete pattern
  - **Dependencies**: None (Phase 0 creates schema)
  - **Effort**: S

- [x] 3.2 Implement PrismaTenantRepository
  - **Description**: Implement ITenantRepository using Prisma client
  - **Acceptance Criteria**:
    - All interface methods implemented
    - findByProperty filters by propertyId, supports active/moved-out filtering
    - softDelete sets movedOutAt timestamp (never hard deletes)
    - assignRoom and removeRoomAssignment handle tenant-room relationship
    - Includes room data in tenant queries for display
  - **Dependencies**: 1.2, 3.1
  - **Effort**: M

## 4. API Layer

- [x] 4.1 Implement tenant CRUD API routes
  - **Description**: Create REST endpoints for tenant management scoped to a property
  - **Acceptance Criteria**:
    - POST /api/properties/[propertyId]/tenants — create tenant (authenticated)
    - GET /api/properties/[propertyId]/tenants — list tenants (authenticated)
    - GET /api/properties/[propertyId]/tenants/[tenantId] — get tenant detail (authenticated)
    - PUT /api/properties/[propertyId]/tenants/[tenantId] — update tenant info (authenticated)
    - POST /api/properties/[propertyId]/tenants/[tenantId]/move-out — move out tenant (authenticated)
    - Property access middleware applied to all routes
    - Input validation with Zod schemas
    - Consistent JSON error responses
  - **Dependencies**: 2.1, 3.2
  - **Effort**: L

- [x] 4.2 Implement room assignment API route
  - **Description**: Create REST endpoint for assigning tenant to a room
  - **Acceptance Criteria**:
    - POST /api/properties/[propertyId]/tenants/[tenantId]/assign-room — assign room (authenticated)
    - Input validation: roomId required
    - Validates room is available
    - Returns updated tenant with room details
    - Error codes: 404 (room/tenant not found), 409 (room occupied)
  - **Dependencies**: 2.2, 3.2
  - **Effort**: M

- [x] 4.3 Write API route tests
  - **Description**: Test all tenant API endpoints
  - **Acceptance Criteria**:
    - Tests for each endpoint: success, validation errors, not found, unauthorized
    - Tests for room assignment edge cases (occupied, under renovation)
    - Tests for move-out (soft delete, room freed)
    - Tests for property access middleware enforcement
    - Minimum 18 tests
  - **Dependencies**: 4.1, 4.2
  - **Effort**: L

## 5. UI Layer

- [x] 5.1 Create TenantForm component
  - **Description**: Build mobile-responsive form for creating and editing tenants
  - **Acceptance Criteria**:
    - Fields: name (text), phone (tel), email (email)
    - Supports create and edit modes via props
    - Client-side validation with React Hook Form + Zod
    - Mobile-optimized: single column, 44x44px touch targets, appropriate keyboard types
    - Loading state on submission
    - Success/error feedback via toast
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [x] 5.2 Create TenantList page
  - **Description**: Build page showing all tenants for the active property
  - **Acceptance Criteria**:
    - Card layout showing tenant name and current room assignment
    - Single-column layout on mobile, full-width cards
    - Tap card to view tenant detail
    - "Add Tenant" button
    - Loading and empty states
    - Fetches tenants via TanStack Query
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [x] 5.3 Create TenantDetail page
  - **Description**: Build tenant detail view with all info and actions
  - **Acceptance Criteria**:
    - Displays name, phone, email, assigned room, assignment date
    - Edit, Assign Room, and Move Out action buttons
    - Single-column layout on mobile
    - All interactive elements 44x44px minimum
    - All text via translation keys
  - **Dependencies**: 4.1, 5.1
  - **Effort**: M

- [x] 5.4 Create RoomAssignment component
  - **Description**: Build room selection interface for tenant assignment
  - **Acceptance Criteria**:
    - Displays list of available rooms only (fetched from room API)
    - Single-column layout with room cards
    - Shows room number, type, and rent for each option
    - Confirmation on successful assignment
    - Error display for occupied rooms
    - 44x44px touch targets
    - All text via translation keys
  - **Dependencies**: 4.2
  - **Effort**: M

- [x] 5.5 Create MoveOutDialog component
  - **Description**: Build confirmation dialog for tenant move-out
  - **Acceptance Criteria**:
    - Confirmation dialog with warning text
    - Confirm and Cancel buttons (44x44px touch targets)
    - Shows success message after move-out
    - Room status updates in UI after move-out
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: S

## 6. Internationalization (i18n)

- [x] 6.1 Extract and translate tenant management strings
  - **Description**: Add all tenant management UI text to translation files
  - **Acceptance Criteria**:
    - All form labels, buttons, messages in en.json and id.json
    - Translation keys follow `tenant.*` naming convention
    - Validation messages translated
    - Room assignment strings translated
    - Move-out confirmation dialog translated
  - **Dependencies**: 5.1, 5.2, 5.3, 5.4, 5.5
  - **Effort**: S

## 7. Testing & Validation

- [ ] 7.1 Test tenant CRUD workflow
  - **Description**: Verify tenant creation, update, and retrieval
  - **Acceptance Criteria**:
    - Can create tenant in under 30 seconds
    - Tenant appears in list after creation
    - Tenant update persists within 2 seconds
    - All fields validated correctly
  - **Dependencies**: 5.2, 5.3
  - **Effort**: S

- [ ] 7.2 Test room assignment workflow
  - **Description**: Verify room assignment meets acceptance criteria
  - **Acceptance Criteria**:
    - Can assign tenant to room in under 20 seconds
    - Only available rooms shown in selection
    - Room status updates to occupied after assignment
    - Error displayed for occupied rooms
  - **Dependencies**: 5.4
  - **Effort**: S

- [ ] 7.3 Test move-out workflow
  - **Description**: Verify move-out meets acceptance criteria
  - **Acceptance Criteria**:
    - Room status changes to available within 2 seconds
    - Tenant record preserved in database (soft delete)
    - Confirmation dialog prevents accidental removal
  - **Dependencies**: 5.5
  - **Effort**: S

- [ ] 7.4 Test mobile responsiveness
  - **Description**: Verify all tenant screens work on mobile
  - **Acceptance Criteria**:
    - All screens render at 320px-480px without horizontal scroll
    - All touch targets minimum 44x44px
    - Forms and lists display correctly on mobile
    - Single-column layouts maintained
  - **Dependencies**: 5.1, 5.2, 5.3, 5.4, 5.5
  - **Effort**: M

## Open Questions / Assumptions

- **Phone Number Format**: No specific format validation for phone numbers — free-text. Post-MVP enhancement to add country-specific validation.
- **Room Type Values**: No predefined list of room types — free-text.
- **Concurrent Access**: Last write wins for MVP. Optimistic locking is post-MVP.
- **Data Migration**: No requirements for importing existing tenant data.
- **Property Scoping**: All tenant operations are scoped to the active property via `propertyId` in the URL path and validated by property access middleware.
- **Moved-Out Tenant Visibility**: Active tenant list excludes moved-out tenants by default. Moved-out tenants can be viewed via a separate filter (post-MVP) or by direct link.
