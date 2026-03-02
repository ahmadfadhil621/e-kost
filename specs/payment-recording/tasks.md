# Tasks: Payment Recording

## 1. Domain Layer

- [ ] 1.1 Define Payment entity and validation schemas
  - **Description**: Create shared Zod schemas for payment CRUD and TypeScript interfaces for Payment
  - **Acceptance Criteria**:
    - `createPaymentSchema` validates tenantId (required, valid UUID), amount (positive number, required), paymentDate (valid date, required)
    - TypeScript interfaces for Payment, CreatePaymentInput
    - Amount stored as decimal with 2 decimal places
  - **Dependencies**: None
  - **Effort**: S

- [ ] 1.2 Define IPaymentRepository interface
  - **Description**: Create repository interface for payment data access
  - **Acceptance Criteria**:
    - Methods: create, findByProperty, findByTenant, findById
    - findByProperty returns payments with tenant names, sorted by paymentDate descending
    - findByTenant returns payments for a single tenant, sorted by paymentDate descending, with count
    - All methods return typed promises
  - **Dependencies**: 1.1
  - **Effort**: S

## 2. Service Layer

- [ ] 2.1 Implement PaymentService
  - **Description**: Build service layer with business logic for payment recording and retrieval
  - **Acceptance Criteria**:
    - `createPayment` validates tenant exists, tenant has active room assignment (not moved out), amount is positive, date is valid
    - `listPayments` returns all payments for property with tenant names, sorted by date descending
    - `getPaymentsByTenant` returns payments for a specific tenant with count, sorted by date descending
    - All operations validate property access via PropertyService
    - Recording timestamp set automatically in UTC
  - **Dependencies**: 1.2
  - **Effort**: M

- [ ] 2.2 Write unit tests for PaymentService
  - **Description**: Test all payment business logic
  - **Acceptance Criteria**:
    - Tests for creation (valid data, missing fields, negative/zero amount, invalid date, moved-out tenant blocked, no room assignment blocked)
    - Tests for listing (ordering, empty, with tenant names)
    - Tests for per-tenant listing (ordering, count, empty)
    - Property-based tests for correctness properties
    - Minimum 15 tests
  - **Dependencies**: 2.1
  - **Effort**: M

## 3. Data Layer

- [ ] 3.1 Verify Prisma schema for Payment
  - **Description**: Ensure Payment model exists in Prisma schema with correct fields, indexes, and relations
  - **Acceptance Criteria**:
    - Payment model: id, tenantId, amount (Decimal), paymentDate (Date), createdAt
    - Index on tenantId for efficient per-tenant queries
    - Index on (propertyId, paymentDate) for sorted listing — or tenantId with property resolved via tenant relation
    - Relation to Tenant model
    - Amount stored as Decimal(10,2) for currency precision
  - **Dependencies**: None (Phase 0 creates schema)
  - **Effort**: S

- [ ] 3.2 Implement PrismaPaymentRepository
  - **Description**: Implement IPaymentRepository using Prisma client
  - **Acceptance Criteria**:
    - All interface methods implemented
    - findByProperty includes tenant name via relation join
    - findByTenant orders by paymentDate descending, returns count
    - Proper error handling for not-found cases
  - **Dependencies**: 1.2, 3.1
  - **Effort**: M

## 4. API Layer

- [ ] 4.1 Implement payment API routes
  - **Description**: Create REST endpoints for payment recording and retrieval scoped to a property
  - **Acceptance Criteria**:
    - POST /api/properties/[propertyId]/payments — record payment (authenticated)
    - GET /api/properties/[propertyId]/payments — list all payments for property (authenticated)
    - GET /api/properties/[propertyId]/tenants/[tenantId]/payments — list payments for tenant (authenticated)
    - Property access middleware applied to all routes
    - Input validation with Zod schemas
    - Consistent JSON error responses (400, 404, 409)
  - **Dependencies**: 2.1, 3.2
  - **Effort**: M

- [ ] 4.2 Write API route tests
  - **Description**: Test all payment API endpoints
  - **Acceptance Criteria**:
    - Tests for each endpoint: success, validation errors, not found, unauthorized
    - Tests for moved-out tenant payment blocked
    - Tests for tenant without room assignment blocked
    - Minimum 12 tests
  - **Dependencies**: 4.1
  - **Effort**: M

## 5. UI Layer

- [ ] 5.1 Create PaymentForm component
  - **Description**: Build mobile-responsive form for recording payments
  - **Acceptance Criteria**:
    - Fields: tenant selection (dropdown), payment amount (number), payment date (date picker)
    - Tenant dropdown shows only active tenants with room assignments
    - Client-side validation with React Hook Form + Zod
    - Mobile-optimized: single column, fits in initial viewport, 44x44px touch targets
    - Recording timestamp populated automatically
    - Form clears after successful submission
    - Loading state on submission
    - Success/error feedback via toast
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [ ] 5.2 Create PaymentList page
  - **Description**: Build page showing all payments for the active property
  - **Acceptance Criteria**:
    - Card layout showing tenant name, amount, payment date, recording timestamp
    - Single-column layout on mobile, full-width cards
    - Payments sorted by date descending (most recent first)
    - "Record Payment" button
    - Loading and empty states
    - Currency formatting via locale
    - Fetches payments via TanStack Query
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [ ] 5.3 Create TenantPaymentSection component
  - **Description**: Build per-tenant payment section for embedding in tenant detail page
  - **Acceptance Criteria**:
    - Displays all payments for a specific tenant
    - Each payment shows amount, date, recording timestamp
    - Payments sorted by date descending
    - Shows total count of payments
    - Loading and empty states
    - Currency formatting via locale
    - Fetches payments via TanStack Query
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [ ] 5.4 Integrate PaymentSection into tenant detail page
  - **Description**: Add payment section to existing tenant detail page
  - **Acceptance Criteria**:
    - Payment section appears in tenant detail view
    - Correctly passes tenantId and propertyId
    - Mobile-responsive within existing page layout
  - **Dependencies**: 5.3
  - **Effort**: S

## 6. Internationalization (i18n)

- [ ] 6.1 Extract and translate payment recording strings
  - **Description**: Add all payment UI text to translation files
  - **Acceptance Criteria**:
    - All form labels, buttons, messages in en.json and id.json
    - Translation keys follow `payment.*` naming convention
    - Validation messages translated
    - Currency formatting respects locale (decimal separators, symbols)
    - Confirmation messages translated
  - **Dependencies**: 5.1, 5.2, 5.3
  - **Effort**: S

## 7. Testing & Validation

- [ ] 7.1 Test payment recording workflow
  - **Description**: Verify payment recording meets acceptance criteria
  - **Acceptance Criteria**:
    - Can record payment in under 20 seconds
    - Only active tenants shown in dropdown
    - Positive amount validation works
    - Immediate confirmation displayed
    - Form clears after submission
  - **Dependencies**: 5.1
  - **Effort**: S

- [ ] 7.2 Test payment list views
  - **Description**: Verify payment list and per-tenant views
  - **Acceptance Criteria**:
    - All payments displayed, most recent first
    - Per-tenant view shows correct count
    - All payment details visible on mobile
    - No horizontal scrolling
  - **Dependencies**: 5.2, 5.3
  - **Effort**: S

- [ ] 7.3 Test data persistence
  - **Description**: Verify payment data persists correctly
  - **Acceptance Criteria**:
    - Payments visible after closing and reopening application
    - All payment details unchanged after persistence
    - No data loss during recording
  - **Dependencies**: 5.1, 5.2
  - **Effort**: S

- [ ] 7.4 Test mobile responsiveness
  - **Description**: Verify all payment screens work on mobile
  - **Acceptance Criteria**:
    - All screens render at 320px-480px without horizontal scroll
    - All touch targets minimum 44x44px
    - Payment form fits in initial viewport
    - Single-column layouts maintained
  - **Dependencies**: 5.1, 5.2, 5.3
  - **Effort**: M

- [ ] 7.5 Test performance with 10,000 payments
  - **Description**: Verify system handles required payment capacity
  - **Acceptance Criteria**:
    - List view remains responsive with 10,000 records
    - Payment recording remains fast
    - No performance degradation
  - **Dependencies**: 5.2
  - **Effort**: S

## Open Questions / Assumptions

- **Payment Editing**: No requirements for editing or deleting payments after recording. Payments are immutable records.
- **Payment Method**: No requirement to track payment method (cash, transfer, etc.). Post-MVP enhancement.
- **Partial Payments**: No payment allocation logic — all payments are generic amounts against a tenant.
- **Date Input**: Payment date defaults to today, with date picker for past dates.
- **Property Scoping**: All payment operations are scoped to the active property via `propertyId` in the URL path and validated by property access middleware. Payment's property association is derived from tenant's property.
- **Currency**: Formatting respects locale via `Intl.NumberFormat`. Currency code from i18n config, not hardcoded.
