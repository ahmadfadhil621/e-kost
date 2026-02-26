# Tasks: Outstanding Balance per Tenant

## 1. Backend - Balance Calculation

- [ ] 1.1 Implement outstanding balance calculation logic
  - **Description**: Create service/function to calculate outstanding balance for a tenant
  - **Acceptance Criteria**:
    - Retrieves tenant's assigned room monthly rent
    - Sums all recorded payments for tenant
    - Calculates difference: expected rent minus total payments
    - Returns zero if payments equal or exceed rent
    - Returns rent amount if no payments recorded
    - Calculation accurate to nearest currency unit (no rounding errors)
    - Uses at least two decimal places for currency amounts
  - **Dependencies**: None (requires tenant and payment data)
  - **Effort**: M
  - **Requirements**: Requirement 1, Constraints

- [ ] 1.2 Implement balance retrieval endpoint
  - **Description**: Create API endpoint to get outstanding balance for tenant
  - **Acceptance Criteria**:
    - GET endpoint accepts tenant ID
    - Returns calculated outstanding balance
    - Returns monthly rent amount for reference
    - Returns total payments recorded
    - Recalculates on each request (real-time)
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 1, 2

- [ ] 1.3 Implement balance update triggers
  - **Description**: Ensure balance recalculates when payments or room assignments change
  - **Acceptance Criteria**:
    - Balance recalculates immediately when payment recorded
    - Balance recalculates immediately when room assignment changes
    - Balance preserved when tenant moves out
    - Updated balance available within 2 seconds
  - **Dependencies**: 1.1
  - **Effort**: M
  - **Requirements**: Requirement 5


## 2. Frontend - Balance Display

- [ ] 2.1 Create outstanding balance section in tenant detail view
  - **Description**: Build mobile-responsive section showing balance in tenant detail page
  - **Acceptance Criteria**:
    - Displays outstanding balance prominently
    - Shows monthly rent amount for reference
    - Shows total payments recorded
    - Balance visible without scrolling beyond initial viewport on mobile
    - Single-column layout on mobile (320px-480px width)
    - Clear, readable format with proper currency display
  - **Dependencies**: 1.2
  - **Effort**: M
  - **Requirements**: Requirement 2, 6

- [ ] 2.2 Create color-coded status indicators
  - **Description**: Build visual status indicators for payment status
  - **Acceptance Criteria**:
    - Green indicator/label for zero balance (paid status)
    - Red indicator/label for balance greater than zero (unpaid status)
    - Uses both color and text/icon (not color alone) for accessibility
    - Colors and icons clearly distinguishable at phone scale
    - No magnification required to see indicators
  - **Dependencies**: 1.2
  - **Effort**: S
  - **Requirements**: Requirement 3, Constraints

- [ ] 2.3 Add balance information to tenant list view
  - **Description**: Display outstanding balance and status in tenant list cards
  - **Acceptance Criteria**:
    - Each tenant card shows outstanding balance amount
    - Each tenant card shows color-coded status indicator
    - Single-column layout with no horizontal scrolling
    - Balance amounts readable at phone scale
    - Status indicators visible and distinguishable
  - **Dependencies**: 1.2, 2.2
  - **Effort**: M
  - **Requirements**: Requirement 4, 6

- [ ] 2.4 Implement optional balance sorting/grouping
  - **Description**: Add ability to sort or group tenants by outstanding balance
  - **Acceptance Criteria**:
    - Option to prioritize tenants with outstanding balances
    - Sorting updates list immediately
    - Works on mobile layout
  - **Dependencies**: 2.3
  - **Effort**: S
  - **Requirements**: Requirement 4


## 3. Testing & Validation

- [ ] 3.1 Test balance calculation accuracy
  - **Description**: Verify balance calculations are correct
  - **Acceptance Criteria**:
    - Balance equals rent when no payments recorded
    - Balance equals zero when payments equal or exceed rent
    - Balance correctly calculates rent minus payments
    - No rounding errors in calculations
    - Accurate to nearest currency unit
  - **Dependencies**: 1.1
  - **Effort**: S
  - **Requirements**: Requirement 1, Success Criteria

- [ ] 3.2 Test balance updates after payment
  - **Description**: Verify balance recalculates when payment recorded
  - **Acceptance Criteria**:
    - Balance updates within 2 seconds after payment recorded
    - Updated balance reflects new payment
    - Status indicator updates if balance reaches zero
  - **Dependencies**: 1.3, 2.1, 2.2
  - **Effort**: S
  - **Requirements**: Requirement 5, Success Criteria

- [ ] 3.3 Test balance updates after room assignment change
  - **Description**: Verify balance recalculates when room assignment changes
  - **Acceptance Criteria**:
    - Balance updates within 2 seconds after room change
    - New balance based on new room's monthly rent
    - Previous payments still counted
  - **Dependencies**: 1.3, 2.1
  - **Effort**: S
  - **Requirements**: Requirement 5, Success Criteria

- [ ] 3.4 Test balance display in tenant detail view
  - **Description**: Verify balance display meets acceptance criteria
  - **Acceptance Criteria**:
    - Can view balance in under 5 seconds
    - Balance visible without scrolling on mobile
    - All reference information displayed (rent, payments)
  - **Dependencies**: 2.1
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 3.5 Test status indicators
  - **Description**: Verify status indicators meet accessibility and visibility requirements
  - **Acceptance Criteria**:
    - Indicators visually distinct at phone scale
    - Both color and text/icon used
    - Green for paid, red for unpaid
    - No magnification required
  - **Dependencies**: 2.2, 2.3
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 3.6 Test tenant list with balance information
  - **Description**: Verify balance information in list view
  - **Acceptance Criteria**:
    - Can identify tenants with outstanding balances at a glance
    - Balance amounts readable on mobile
    - Status indicators recognizable at phone scale
  - **Dependencies**: 2.3
  - **Effort**: S
  - **Requirements**: Success Criteria

- [ ] 3.7 Test mobile responsiveness
  - **Description**: Verify all balance displays work on mobile devices
  - **Acceptance Criteria**:
    - All screens render correctly on 320px-480px width
    - No horizontal scrolling required
    - No pinch-to-zoom required for readability
    - Single-column layouts maintained
    - Glanceable format on mobile
  - **Dependencies**: 2.1, 2.3
  - **Effort**: M
  - **Requirements**: Requirement 6, Success Criteria

- [ ] 3.8 Test performance with 1,000 tenants
  - **Description**: Verify system handles required tenant capacity with real-time calculations
  - **Acceptance Criteria**:
    - System supports at least 1,000 tenant records
    - No performance degradation with full capacity
    - Balance calculations remain fast
    - List view remains responsive
  - **Dependencies**: 1.1, 2.3
  - **Effort**: S
  - **Requirements**: Constraints

## Open Questions / Assumptions

- **Tech Stack**: Specific technologies not defined in requirements
- **Authentication**: Better Auth required—all endpoints must verify authenticated session; see user-authentication spec
- **Currency**: No currency specification or formatting rules
- **Billing Period**: Assumes simple monthly rent model (no pro-rating, no multiple billing periods)
- **Payment Application**: Assumes all payments apply to current rent (no payment allocation logic)
- **Historical Balances**: No requirements for tracking balance history over time
- **Overpayment**: No specific requirements for handling overpayments (when payments exceed rent)
- **Multiple Rooms**: Assumes tenant assigned to single room at a time
- **Data Dependencies**: Assumes tenant, room, and payment data available from other features


## 4. Internationalization (i18n)

- [ ] 4.1 Extract and translate balance display strings
  - **Description**: Move all UI text to translation keys for balance features
  - **Acceptance Criteria**:
    - All balance labels translated
    - All status labels translated (paid, unpaid)
    - All section headers translated
    - Currency formatting respects locale
    - Translation keys follow consistent naming convention
  - **Dependencies**: Tenant i18n setup (6.1 from tenant-room-basics)
  - **Effort**: S
  - **Requirements**: Cross-cutting Constraint 2
