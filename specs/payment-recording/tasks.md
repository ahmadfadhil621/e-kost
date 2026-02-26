# Tasks: Payment Recording

## 1. Database Setup

- [ ] 1.1 Create payment database schema
  - **Description**: Create database table for payments with fields: id (unique), tenant_id, payment_amount, payment_date, created_at
  - **Acceptance Criteria**:
    - Payment table created with all required fields
    - Unique identifier auto-generated
    - Foreign key relationship to tenant table
    - Timestamps in UTC timezone
    - Payment amount stored as positive decimal
  - **Dependencies**: None
  - **Effort**: M
  - **Requirements**: Requirement 1, 4, Constraints

## 2. Backend - Payment Operations

- [ ] 2.1 Implement payment recording endpoint
  - **Description**: Create API endpoint to record new payment
  - **Acceptance Criteria**:
    - POST endpoint accepts tenant_id, payment_amount, and payment_date
    - Validates all required fields present
    - Validates payment amount is positive number
    - Validates payment date is valid calendar date
    - Validates tenant has active room assignment
    - Returns unique payment ID on success
    - Records creation timestamp in UTC automatically
    - Returns validation errors for missing/invalid fields
    - Persists to database immediately
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 1

- [ ] 2.2 Implement payment list retrieval endpoint
  - **Description**: Create API endpoint to retrieve all payments
  - **Acceptance Criteria**:
    - GET endpoint returns all recorded payments
    - Each payment includes tenant name, amount, payment date, and recording timestamp
    - Payments sorted by payment date descending (most recent first)
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 2

- [ ] 2.3 Implement per-tenant payment retrieval endpoint
  - **Description**: Create API endpoint to retrieve payments for specific tenant
  - **Acceptance Criteria**:
    - GET endpoint accepts tenant_id parameter
    - Returns all payments for specified tenant
    - Each payment includes amount, payment date, and recording timestamp
    - Payments sorted by payment date descending (most recent first)
    - Returns total count of payments for tenant
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 3

## 3. Frontend - Payment Recording UI

- [ ] 3.1 Create payment recording form
  - **Description**: Build mobile-responsive form for recording payments
  - **Acceptance Criteria**:
    - Form displays exactly three fields: tenant selection, payment amount, payment date
    - Tenant dropdown shows only tenants with active room assignments
    - Single-column layout on mobile (320px-480px width)
    - Form fits in initial viewport without scrolling on mobile
    - Validates required fields before submission
    - Validates payment amount is positive number
    - Displays validation errors clearly
    - Shows immediate confirmation message on success
    - Clears form fields after successful submission
    - Recording timestamp populated automatically (not manual entry)
    - Form fields vertically stacked with adequate spacing
  - **Dependencies**: 2.1
  - **Effort**: M
  - **Requirements**: Requirement 1, 5, 6

- [ ] 3.2 Create payment list view
  - **Description**: Build mobile-responsive list showing all payments
  - **Acceptance Criteria**:
    - Displays scrollable list of all payments
    - Each item shows tenant name, payment amount, payment date, and recording timestamp
    - Single-column layout with no horizontal scrolling
    - Full-width cards with adequate padding and clear visual separation
    - Payments sorted by payment date descending (most recent first)
    - Minimum 44x44 pixel touch targets
  - **Dependencies**: 2.2
  - **Effort**: M
  - **Requirements**: Requirement 2, 5

- [ ] 3.3 Create per-tenant payment view
  - **Description**: Build mobile-responsive section showing payments for specific tenant
  - **Acceptance Criteria**:
    - Displays in tenant detail page
    - Shows all payments for that tenant
    - Each payment shows amount, payment date, and recording timestamp
    - Single-column layout with no horizontal scrolling
    - Payments sorted by payment date descending (most recent first)
    - Displays total count of payments
    - Fits on single mobile screen without excessive scrolling
  - **Dependencies**: 2.3
  - **Effort**: M
  - **Requirements**: Requirement 3, 5

## 4. Testing & Validation

- [ ] 4.1 Test payment recording workflow
  - **Description**: Verify payment recording meets all acceptance criteria
  - **Acceptance Criteria**:
    - Can record payment in under 20 seconds
    - All required fields validated
    - Only active tenants shown in dropdown
    - Positive amount validation works
    - Unique ID assigned
    - Data persisted to database
    - Immediate confirmation displayed
    - Form clears after submission
  - **Dependencies**: 3.1
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 4.2 Test payment list view
  - **Description**: Verify payment list meets all acceptance criteria
  - **Acceptance Criteria**:
    - All payments displayed in scrollable list
    - Most recent payments shown first
    - All payment details visible on mobile
    - No horizontal scrolling required
  - **Dependencies**: 3.2
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 4.3 Test per-tenant payment view
  - **Description**: Verify per-tenant payments meet all acceptance criteria
  - **Acceptance Criteria**:
    - All tenant payments displayed
    - Most recent payments shown first
    - Total count displayed
    - Fits on single mobile screen
  - **Dependencies**: 3.3
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 4.4 Test data persistence
  - **Description**: Verify payment data persists correctly
  - **Acceptance Criteria**:
    - Payments visible after closing and reopening application
    - All payment details unchanged after persistence
    - No data loss during recording
  - **Dependencies**: 3.1, 3.2
  - **Effort**: S
  - **Requirements**: Requirement 4, Success Criteria

- [ ] 4.5 Test mobile responsiveness
  - **Description**: Verify all screens work on mobile devices
  - **Acceptance Criteria**:
    - All screens render correctly on 320px-480px width
    - No horizontal scrolling required
    - All touch targets minimum 44x44 pixels
    - No pinch-to-zoom required for readability
    - Single-column layouts maintained
    - Payment form fits in initial viewport
  - **Dependencies**: 3.1, 3.2, 3.3
  - **Effort**: M
  - **Requirements**: Requirement 5, Success Criteria

- [ ] 4.6 Test performance with 10,000 payments
  - **Description**: Verify system handles required payment capacity
  - **Acceptance Criteria**:
    - System supports at least 10,000 payment records
    - No performance degradation with full capacity
    - List view remains responsive
    - Payment recording remains fast
  - **Dependencies**: 3.1, 3.2
  - **Effort**: S
  - **Requirements**: Constraints

## Open Questions / Assumptions

- **Tech Stack**: Specific technologies (framework, database, language) not defined in requirements
- **Authentication**: Better Auth required—all endpoints must verify authenticated session; see user-authentication spec
- **Payment Editing**: No requirements for editing or deleting payments after recording
- **Payment Method**: No requirement to track payment method (cash, check, transfer)
- **Currency**: No currency specification or multi-currency support
- **Partial Payments**: No requirements for handling partial payments or payment plans
- **Date Input**: No specification for date picker vs manual entry
- **Tenant Selection**: Assumes tenant data available from tenant-room-basics feature


## 5. Internationalization (i18n)

- [ ] 5.1 Extract and translate payment recording strings
  - **Description**: Move all UI text to translation keys for payment features
  - **Acceptance Criteria**:
    - All form labels translated (tenant, amount, date)
    - All validation messages translated
    - All confirmation dialogs translated
    - All success/error messages translated
    - Currency formatting respects locale
    - Translation keys follow consistent naming convention
  - **Dependencies**: Tenant i18n setup (6.1 from tenant-room-basics)
  - **Effort**: S
  - **Requirements**: Cross-cutting Constraint 2
