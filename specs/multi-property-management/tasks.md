# Tasks: Multi-Property Management

## 1. Domain Layer

- [ ] 1.1 Define Property entity and validation schemas
  - **Description**: Create shared Zod schemas for property CRUD and TypeScript interfaces for Property and PropertyStaff
  - **Acceptance Criteria**:
    - `createPropertySchema` validates name (1-200 chars, required) and address (1-500 chars, required)
    - `updatePropertySchema` validates partial updates with at least one field
    - `addStaffSchema` validates email format
    - TypeScript interfaces for Property, PropertyStaff, PropertyRole
  - **Dependencies**: None
  - **Effort**: S

- [ ] 1.2 Define IPropertyRepository interface
  - **Description**: Create repository interface for property and staff data access
  - **Acceptance Criteria**:
    - Methods: create, findById, findByUser, update, softDelete
    - Staff methods: addStaff, removeStaff, findStaff, findUserRole
    - All methods return typed promises
  - **Dependencies**: 1.1
  - **Effort**: S

## 2. Service Layer

- [ ] 2.1 Implement PropertyService
  - **Description**: Build service layer with business logic for property CRUD and authorization
  - **Acceptance Criteria**:
    - `createProperty` sets authenticated user as owner
    - `updateProperty` validates caller is owner
    - `deleteProperty` soft-deletes, validates caller is owner
    - `listProperties` returns properties where user is owner or staff, excludes deleted
    - `getProperty` validates user access (owner or staff)
    - `validateAccess` returns role or throws ForbiddenError
  - **Dependencies**: 1.2
  - **Effort**: L

- [ ] 2.2 Implement staff management in PropertyService
  - **Description**: Add staff invitation and removal business logic
  - **Acceptance Criteria**:
    - `addStaff` validates caller is owner, target user exists, not already staff
    - `removeStaff` validates caller is owner, prevents owner self-removal
    - `listStaff` returns staff with user details (name, email)
    - Appropriate errors: 403 (not owner), 404 (user not found), 409 (duplicate)
  - **Dependencies**: 2.1
  - **Effort**: M

- [ ] 2.3 Write unit tests for PropertyService
  - **Description**: Test all property and staff business logic
  - **Acceptance Criteria**:
    - Tests for creation (valid data, missing fields, owner assignment)
    - Tests for listing (owned, staff, exclude deleted)
    - Tests for update/delete (owner-only enforcement)
    - Tests for staff management (add, remove, duplicate, unregistered, self-removal)
    - Tests for access validation (owner, staff, unauthorized)
    - Property-based tests for correctness properties
    - Minimum 25 tests
  - **Dependencies**: 2.1, 2.2
  - **Effort**: L

## 3. Data Layer

- [ ] 3.1 Verify Prisma schema for Property and PropertyStaff
  - **Description**: Ensure Property and PropertyStaff models exist in Prisma schema with correct fields, indexes, and relations
  - **Acceptance Criteria**:
    - Property model: id, name, address, ownerId, createdAt, updatedAt, deletedAt
    - PropertyStaff model: id, propertyId, userId, assignedAt
    - Unique constraint on (propertyId, userId) for PropertyStaff
    - Indexes on ownerId and userId for efficient queries
    - Relations to User, Room, Tenant, Payment, Expense
  - **Dependencies**: None (Phase 0 creates schema)
  - **Effort**: S

- [ ] 3.2 Implement PrismaPropertyRepository
  - **Description**: Implement IPropertyRepository using Prisma client
  - **Acceptance Criteria**:
    - All interface methods implemented
    - `findByUser` queries both owned properties and staff assignments
    - Soft-deleted properties excluded from queries (WHERE deletedAt IS NULL)
    - Staff queries include user relation for name/email
    - `findUserRole` checks both ownership and staff table
  - **Dependencies**: 1.2, 3.1
  - **Effort**: M

## 4. API Layer

- [ ] 4.1 Implement property CRUD API routes
  - **Description**: Create REST endpoints for property management
  - **Acceptance Criteria**:
    - POST /api/properties — create property (authenticated)
    - GET /api/properties — list user's properties (authenticated)
    - GET /api/properties/[propertyId] — get property detail (access validated)
    - PUT /api/properties/[propertyId] — update property (owner only)
    - DELETE /api/properties/[propertyId] — soft-delete property (owner only)
    - Input validation with Zod schemas
    - Consistent JSON error responses with appropriate status codes
  - **Dependencies**: 2.1, 3.2
  - **Effort**: L

- [ ] 4.2 Implement staff management API routes
  - **Description**: Create REST endpoints for staff invitation and removal
  - **Acceptance Criteria**:
    - POST /api/properties/[propertyId]/staff — add staff by email (owner only)
    - GET /api/properties/[propertyId]/staff — list staff (owner or staff)
    - DELETE /api/properties/[propertyId]/staff/[userId] — remove staff (owner only)
    - Input validation with Zod schemas
    - Correct error codes: 403, 404, 409
  - **Dependencies**: 2.2, 3.2
  - **Effort**: M

- [ ] 4.3 Implement property access middleware
  - **Description**: Create reusable middleware that validates user access to a property for all property-scoped routes
  - **Acceptance Criteria**:
    - Extracts propertyId from URL params
    - Validates authenticated user is owner or staff
    - Returns 403 Forbidden if no access
    - Optionally requires owner role for write operations
    - Used by all downstream feature routes (rooms, tenants, payments, etc.)
  - **Dependencies**: 2.1
  - **Effort**: M

- [ ] 4.4 Write API route tests
  - **Description**: Test all property and staff API endpoints
  - **Acceptance Criteria**:
    - Tests for each endpoint: success cases, validation errors, auth errors
    - Tests for property access middleware
    - Tests for owner-only operations returning 403 for staff
    - Tests for staff management edge cases
    - Minimum 20 tests
  - **Dependencies**: 4.1, 4.2, 4.3
  - **Effort**: L

## 5. UI Layer

- [ ] 5.1 Create PropertyForm component
  - **Description**: Build mobile-responsive form for creating and editing properties
  - **Acceptance Criteria**:
    - Fields: property name (text input), address (textarea)
    - Supports create and edit modes via props
    - Client-side validation with React Hook Form + Zod
    - Mobile-optimized: single column, 44x44px touch targets
    - Loading state on submission
    - Success/error feedback via toast
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [ ] 5.2 Create PropertyList page
  - **Description**: Build page showing all user's properties with selection capability
  - **Acceptance Criteria**:
    - Card layout showing name, address, role badge
    - Single-column layout on mobile, full-width cards
    - Tap card to set as active property
    - "Create Property" button when no properties exist or as floating action
    - Loading and empty states
    - All text via translation keys
  - **Dependencies**: 4.1, 5.1
  - **Effort**: M

- [ ] 5.3 Create PropertySwitcher component
  - **Description**: Build property switching UI accessible from the app header
  - **Acceptance Criteria**:
    - Active property name displayed in header
    - Tap opens bottom sheet (mobile) or dropdown (desktop)
    - Lists all properties with role indicator
    - Selecting property updates localStorage and refreshes page data
    - Disabled state when only one property
    - 44x44px touch targets for all items
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [ ] 5.4 Create StaffManagement component
  - **Description**: Build staff list and invitation UI for property owners
  - **Acceptance Criteria**:
    - Shows current staff list with name, email, remove button
    - "Add staff" form with email input
    - Only visible to property owners
    - Confirmation dialog for staff removal
    - Error handling: unregistered email, duplicate staff
    - 44x44px touch targets
    - All text via translation keys
  - **Dependencies**: 4.2
  - **Effort**: M

- [ ] 5.5 Create PropertyDetail page
  - **Description**: Build property detail view with edit/delete/staff sections
  - **Acceptance Criteria**:
    - Displays property name, address, owner info
    - Edit and Delete buttons visible only for owners
    - Staff management section (using StaffManagement component)
    - Delete confirmation dialog with warning
    - Mobile-optimized single-column layout
    - All text via translation keys
  - **Dependencies**: 5.1, 5.4
  - **Effort**: M

- [ ] 5.6 Integrate PropertySwitcher into app layout
  - **Description**: Add property context to the authenticated app shell
  - **Acceptance Criteria**:
    - PropertySwitcher renders in app header
    - Active property context available via hook/context to all child routes
    - Redirects to property creation if no properties exist
    - Redirects to property selection if no active property
    - Data views refresh when active property changes
  - **Dependencies**: 5.3
  - **Effort**: M

## 6. Internationalization (i18n)

- [ ] 6.1 Extract and translate property management strings
  - **Description**: Add all property and staff management UI text to translation files
  - **Acceptance Criteria**:
    - All form labels, buttons, messages in en.json and id.json
    - Translation keys follow `property.*` naming convention
    - Validation messages translated
    - Staff management strings translated
    - Confirmation dialogs translated
    - Role labels translated (owner/staff)
  - **Dependencies**: 5.1, 5.2, 5.3, 5.4, 5.5
  - **Effort**: S

## 7. Testing & Validation

- [ ] 7.1 Test property CRUD workflow
  - **Description**: Verify property creation, update, and deletion
  - **Acceptance Criteria**:
    - Can create property in under 30 seconds
    - Property appears in list after creation
    - Property update persists correctly
    - Soft delete removes from list
    - Active property switches when current is deleted
  - **Dependencies**: 5.2, 5.5
  - **Effort**: S

- [ ] 7.2 Test property switching and data scoping
  - **Description**: Verify switching properties scopes data correctly
  - **Acceptance Criteria**:
    - Can switch properties in under 3 seconds
    - Room, tenant, payment data changes when property switches
    - No data leakage between properties
    - Active property persists across page reloads
  - **Dependencies**: 5.6
  - **Effort**: M

- [ ] 7.3 Test staff management workflow
  - **Description**: Verify staff invitation and removal
  - **Acceptance Criteria**:
    - Can invite staff in under 20 seconds
    - Staff sees property in their list
    - Staff cannot edit/delete property metadata
    - Removing staff revokes access
    - Error shown for unregistered email
  - **Dependencies**: 5.4
  - **Effort**: S

- [ ] 7.4 Test mobile responsiveness
  - **Description**: Verify all property screens work on mobile
  - **Acceptance Criteria**:
    - All screens render at 320px-480px without horizontal scroll
    - All touch targets minimum 44x44px
    - Property switcher usable with thumb (bottom sheet)
    - Forms and lists display correctly on mobile
  - **Dependencies**: 5.1, 5.2, 5.3, 5.4, 5.5
  - **Effort**: M

## Open Questions / Assumptions

- **Staff Permissions Granularity**: MVP assumes staff has full access to rooms, tenants, payments, expenses within assigned properties. More granular permissions are post-MVP.
- **Property Transfer**: No ownership transfer in MVP. Post-MVP enhancement.
- **Staff Invitation by Email**: MVP requires the invited user to already have a registered account. Email-based invitation with registration link is post-MVP.
- **Active Property Persistence**: Stored in localStorage. If cleared, user selects from list on next visit.
- **Maximum Properties**: No hard limit, but UI optimized for up to 50 properties per user.
