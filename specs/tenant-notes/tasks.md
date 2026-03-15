# Tasks: Tenant Notes

## 1. Domain Layer

- [x] 1.1 Define TenantNote entity and validation schemas
  - **Description**: Create shared Zod schemas for note CRUD and TypeScript interfaces
  - **Acceptance Criteria**:
    - `createNoteSchema` validates content (1-2000 chars, required) and date (valid date, required)
    - `updateNoteSchema` validates partial updates with at least one field
    - TypeScript interface for TenantNote
  - **Dependencies**: None
  - **Effort**: S

- [x] 1.2 Define INoteRepository interface
  - **Description**: Create repository interface for tenant note data access
  - **Acceptance Criteria**:
    - Methods: create, findByTenant, findById, update, delete
    - All methods return typed promises
    - findByTenant returns notes sorted by date descending
  - **Dependencies**: 1.1
  - **Effort**: S

## 2. Service Layer

- [x] 2.1 Implement NoteService
  - **Description**: Build service layer with business logic for note CRUD
  - **Acceptance Criteria**:
    - `createNote` validates content non-empty, date valid, tenant exists and is not moved out
    - `listNotes` returns notes for tenant sorted by date descending
    - `updateNote` validates note exists and belongs to tenant, content non-empty if provided
    - `deleteNote` validates note exists and belongs to tenant, hard deletes
    - All operations validate property access via PropertyService
  - **Dependencies**: 1.2
  - **Effort**: M

- [x] 2.2 Write unit tests for NoteService
  - **Description**: Test all note business logic
  - **Acceptance Criteria**:
    - Tests for creation (valid, empty content, long content, moved-out tenant blocked)
    - Tests for listing (ordering, empty, multiple notes)
    - Tests for update (valid, empty content, preserve ID/createdAt)
    - Tests for deletion (success, not found)
    - Property-based tests for correctness properties
    - Minimum 15 tests
  - **Dependencies**: 2.1
  - **Effort**: M

## 3. Data Layer

- [x] 3.1 Verify Prisma schema for TenantNote
  - **Description**: Ensure TenantNote model exists with correct fields and relations
  - **Acceptance Criteria**:
    - TenantNote model: id, tenantId, content (Text), date (Date), createdAt, updatedAt
    - Index on tenantId for efficient queries
    - Relation to Tenant model
  - **Dependencies**: None (Phase 0 creates schema)
  - **Effort**: S

- [x] 3.2 Implement PrismaNoteRepository
  - **Description**: Implement INoteRepository using Prisma client
  - **Acceptance Criteria**:
    - All interface methods implemented
    - findByTenant orders by date descending
    - delete performs hard delete
    - Proper error handling for not-found cases
  - **Dependencies**: 1.2, 3.1
  - **Effort**: S

## 4. API Layer

- [x] 4.1 Implement note CRUD API routes
  - **Description**: Create REST endpoints for tenant note management
  - **Acceptance Criteria**:
    - POST /api/properties/[propertyId]/tenants/[tenantId]/notes — create note
    - GET /api/properties/[propertyId]/tenants/[tenantId]/notes — list notes
    - PUT /api/properties/[propertyId]/tenants/[tenantId]/notes/[noteId] — update note
    - DELETE /api/properties/[propertyId]/tenants/[tenantId]/notes/[noteId] — delete note
    - Property access middleware applied
    - Input validation with Zod schemas
    - Consistent error responses
  - **Dependencies**: 2.1, 3.2
  - **Effort**: M

- [x] 4.2 Write API route tests
  - **Description**: Test all note API endpoints
  - **Acceptance Criteria**:
    - Tests for each endpoint: success, validation errors, not found, unauthorized
    - Tests for moved-out tenant note creation blocked
    - Minimum 12 tests
  - **Dependencies**: 4.1
  - **Effort**: M

## 5. UI Layer

- [x] 5.1 Create NotesSection component
  - **Description**: Build notes section for embedding in tenant detail page
  - **Acceptance Criteria**:
    - Displays note list and "Add Note" button
    - Loading, empty, and error states
    - "Add Note" disabled for moved-out tenants with explanatory message
    - Single-column layout, full-width cards
    - Fetches notes via TanStack Query
  - **Dependencies**: 4.1
  - **Effort**: M

- [x] 5.2 Create NoteCard component
  - **Description**: Build individual note display card
  - **Acceptance Criteria**:
    - Shows note content, formatted date, creation timestamp
    - Edit and delete icon buttons (44x44px touch targets)
    - Full-width on mobile with clear visual separation
    - Readable text at phone scale
  - **Dependencies**: 5.1
  - **Effort**: S

- [x] 5.3 Create NoteForm component
  - **Description**: Build form for creating and editing notes
  - **Acceptance Criteria**:
    - Textarea for content (auto-expanding, character counter)
    - Date picker defaulting to today
    - Client-side validation with React Hook Form + Zod
    - Submit and cancel buttons (44x44px touch targets)
    - Used for both create (standalone) and edit (inline replacement)
    - Loading state on submission
  - **Dependencies**: 5.1
  - **Effort**: M

- [x] 5.4 Integrate NotesSection into tenant detail page
  - **Description**: Add notes section to existing tenant detail page
  - **Acceptance Criteria**:
    - Notes section appears below tenant info and payment sections
    - Correctly passes tenantId and propertyId
    - Respects moved-out status for read-only mode
    - Mobile-responsive within existing page layout
  - **Dependencies**: 5.1, 5.2, 5.3
  - **Effort**: S

## 6. Internationalization (i18n)

- [x] 6.1 Extract and translate tenant notes strings
  - **Description**: Add all notes UI text to translation files
  - **Acceptance Criteria**:
    - All form labels, buttons, messages in en.json and id.json
    - Translation keys follow `notes.*` naming convention
    - Validation messages, confirmations, and empty states translated
  - **Dependencies**: 5.1, 5.2, 5.3
  - **Effort**: S

## 7. Testing & Validation

- [x] 7.1 Test note CRUD workflow
  - **Description**: Verify note creation, editing, and deletion
  - **Acceptance Criteria**:
    - Can add note in under 15 seconds
    - Note appears in list immediately
    - Can edit note and see changes within 2 seconds
    - Can delete note with confirmation in under 5 seconds
    - Notes sorted by date descending
  - **Dependencies**: 5.4
  - **Effort**: S

- [x] 7.2 Test notes for moved-out tenants
  - **Description**: Verify notes behavior for moved-out tenants
  - **Acceptance Criteria**:
    - Existing notes visible for moved-out tenants
    - "Add Note" disabled with explanatory message
    - Edit and delete still functional for existing notes
  - **Dependencies**: 5.4
  - **Effort**: S

- [x] 7.3 Test mobile responsiveness
  - **Description**: Verify notes section works on mobile
  - **Acceptance Criteria**:
    - Notes section renders at 320px-480px without horizontal scroll
    - Touch targets minimum 44x44px
    - Textarea usable with mobile keyboard
    - Note cards readable at phone scale
  - **Dependencies**: 5.4
  - **Effort**: S

## Open Questions / Assumptions

- **Note Authorship**: MVP does not track which user created/edited a note. Post-MVP enhancement.
- **Note Ordering**: Sorted by the user-specified date, not createdAt. If two notes share the same date, secondary sort by createdAt descending.
- **Character Limit**: 2,000 characters chosen as a practical limit. Can be adjusted based on user feedback.
- **Moved-Out Tenants**: Existing notes remain editable/deletable, but no new notes can be added.
