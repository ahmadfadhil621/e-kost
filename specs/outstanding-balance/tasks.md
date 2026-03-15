# Tasks: Outstanding Balance per Tenant

## 1. Domain Layer

- [ ] 1.1 Define Balance entity and validation schemas
  - **Description**: Create TypeScript interfaces for BalanceResult and balance-related types
  - **Acceptance Criteria**:
    - TypeScript interfaces for BalanceResult (tenantId, monthlyRent, totalPayments, outstandingBalance, status)
    - BalanceStatus type: 'paid' | 'unpaid'
    - No Zod schema needed (balance is computed, not user-input)
  - **Dependencies**: None
  - **Effort**: S

- [ ] 1.2 Define IBalanceCalculator interface
  - **Description**: Create interface for balance calculation operations
  - **Acceptance Criteria**:
    - Methods: calculateBalance(tenantId), calculateBalances(tenantIds) for batch
    - calculateBalances returns Map<string, BalanceResult> for list views
    - All methods return typed promises
  - **Dependencies**: 1.1
  - **Effort**: S

## 2. Service Layer

- [ ] 2.1 Implement BalanceService
  - **Description**: Build service layer with balance calculation business logic
  - **Acceptance Criteria**:
    - `calculateBalance` retrieves tenant's room monthly rent and sums all payments, computes difference
    - Returns zero if payments equal or exceed rent (no negative balances)
    - Returns rent amount if no payments recorded
    - Status is 'paid' when balance is zero, 'unpaid' otherwise
    - `calculateBalances` batch query for list views (single query with GROUP BY)
    - Balance recalculates on every request (no caching — real-time accuracy)
    - All operations validate property access via PropertyService
  - **Dependencies**: 1.2
  - **Effort**: M

- [ ] 2.2 Write unit tests for BalanceService
  - **Description**: Test all balance calculation business logic
  - **Acceptance Criteria**:
    - Tests for calculation (no payments = full rent, partial payment, exact payment, overpayment = zero)
    - Tests for batch calculation (multiple tenants, mixed statuses)
    - Tests for moved-out tenant (balance preserved)
    - Tests for room change (uses new room's rent)
    - Tests for accuracy (no rounding errors, two decimal places)
    - Property-based tests for correctness properties
    - Minimum 15 tests
  - **Dependencies**: 2.1
  - **Effort**: M

## 3. Data Layer

- [ ] 3.1 Implement balance calculation queries
  - **Description**: Build optimized database queries for balance computation
  - **Acceptance Criteria**:
    - Single-tenant query: JOIN tenant → room (monthly rent) + aggregate payments
    - Batch query: GROUP BY with tenant + room JOIN for list views
    - Queries complete in <100ms for 1,000 tenants with 10,000 payments
    - Uses database indexes on tenantId for payment aggregation
  - **Dependencies**: None (uses existing Tenant, Room, Payment tables)
  - **Effort**: M

## 4. API Layer

- [ ] 4.1 Implement balance API routes
  - **Description**: Create REST endpoints for balance retrieval scoped to a property
  - **Acceptance Criteria**:
    - GET /api/properties/[propertyId]/tenants/[tenantId]/balance — single tenant balance (authenticated)
    - GET /api/properties/[propertyId]/balances — all tenant balances for property (authenticated)
    - Optional query param ?status=unpaid for filtering
    - Property access middleware applied
    - Response includes: tenantId, monthlyRent, totalPayments, outstandingBalance, status
    - Response time: <100ms single, <500ms batch (1,000 tenants)
  - **Dependencies**: 2.1, 3.1
  - **Effort**: M

- [ ] 4.2 Write API route tests
  - **Description**: Test all balance API endpoints
  - **Acceptance Criteria**:
    - Tests for single tenant balance (paid, unpaid, no payments, overpaid)
    - Tests for batch balances (mixed statuses, filtering)
    - Tests for property access middleware enforcement
    - Minimum 10 tests
  - **Dependencies**: 4.1
  - **Effort**: M

## 5. UI Layer

- [ ] 5.1 Create BalanceSection component
  - **Description**: Build balance display section for tenant detail page
  - **Acceptance Criteria**:
    - Displays outstanding balance prominently
    - Shows monthly rent and total payments for reference
    - Shows payment status indicator (paid/unpaid)
    - Balance visible without scrolling on mobile
    - Single-column layout
    - Currency formatting via locale
    - Fetches balance via TanStack Query
    - All text via translation keys
  - **Dependencies**: 4.1
  - **Effort**: M

- [ ] 5.2 Create BalanceStatusIndicator component
  - **Description**: Build color-coded status indicator for payment status
  - **Acceptance Criteria**:
    - Green indicator + text label for paid status
    - Red indicator + text label for unpaid status
    - Uses both color and text/icon (not color alone) for accessibility
    - Clearly distinguishable at phone scale
    - Supports small (list) and large (detail) sizes
    - Uses CSS variables for colors (not hardcoded)
    - All text via translation keys
  - **Dependencies**: None
  - **Effort**: S

- [ ] 5.3 Add balance info to tenant list cards
  - **Description**: Display balance and status in tenant list view
  - **Acceptance Criteria**:
    - Each tenant card shows outstanding balance amount
    - Each tenant card shows BalanceStatusIndicator
    - Balance amounts readable at phone scale
    - Single-column layout with no horizontal scrolling
    - Currency formatting via locale
    - Fetches batch balances via TanStack Query
    - All text via translation keys
  - **Dependencies**: 4.1, 5.2
  - **Effort**: M

- [ ] 5.4 Integrate BalanceSection into tenant detail page
  - **Description**: Add balance section to existing tenant detail page
  - **Acceptance Criteria**:
    - Balance section appears prominently in tenant detail view
    - Correctly passes tenantId and propertyId
    - Mobile-responsive within existing page layout
    - Balance refreshes when navigating from payment recording
  - **Dependencies**: 5.1
  - **Effort**: S

- [ ] 5.5 Add optional balance sorting to tenant list
  - **Description**: Allow sorting/filtering tenants by balance status
  - **Acceptance Criteria**:
    - Option to show unpaid tenants first
    - Sorting updates list immediately
    - Works on mobile layout
    - All text via translation keys
  - **Dependencies**: 5.3
  - **Effort**: S

## 6. Internationalization (i18n)

- [ ] 6.1 Extract and translate balance display strings
  - **Description**: Add all balance UI text to translation files
  - **Acceptance Criteria**:
    - All balance labels, status labels in en.json and id.json
    - Translation keys follow `balance.*` naming convention
    - Status labels translated (paid, unpaid)
    - Currency formatting respects locale
    - Section headers translated
  - **Dependencies**: 5.1, 5.2, 5.3
  - **Effort**: S

## 7. Testing & Validation

- [ ] 7.1 Test balance calculation accuracy
  - **Description**: Verify balance calculations are correct
  - **Acceptance Criteria**:
    - Balance equals rent when no payments recorded
    - Balance equals zero when payments equal or exceed rent
    - Balance correctly computes rent minus payments
    - No rounding errors, accurate to 2 decimal places
  - **Dependencies**: 2.1
  - **Effort**: S

- [ ] 7.2 Test balance updates after payment
  - **Description**: Verify balance recalculates when payment recorded
  - **Acceptance Criteria**:
    - Balance updates within 2 seconds after payment
    - Status indicator updates if balance reaches zero
  - **Dependencies**: 5.1, 5.2
  - **Effort**: S

- [ ] 7.3 Test balance updates after room change
  - **Description**: Verify balance recalculates when room assignment changes
  - **Acceptance Criteria**:
    - Balance updates within 2 seconds after room change
    - New balance based on new room's monthly rent
    - Previous payments still counted
  - **Dependencies**: 5.1
  - **Effort**: S

- [ ] 7.4 Test status indicators
  - **Description**: Verify status indicators meet accessibility requirements
  - **Acceptance Criteria**:
    - Indicators visually distinct at phone scale
    - Both color and text/icon used (not color alone)
    - Green for paid, red for unpaid
  - **Dependencies**: 5.2, 5.3
  - **Effort**: S

- [ ] 7.5 Test mobile responsiveness
  - **Description**: Verify all balance displays work on mobile
  - **Acceptance Criteria**:
    - All screens render at 320px-480px without horizontal scroll
    - Balance info glanceable on mobile
    - No pinch-to-zoom required
  - **Dependencies**: 5.1, 5.3
  - **Effort**: M

- [ ] 7.6 Test performance with 1,000 tenants
  - **Description**: Verify balance calculations at scale
  - **Acceptance Criteria**:
    - Batch balance query completes in <500ms for 1,000 tenants
    - List view remains responsive
    - No performance degradation
  - **Dependencies**: 5.3
  - **Effort**: S

## Open Questions / Assumptions

- **Billing Period**: Simple monthly rent model — no pro-rating, no multiple billing periods. Post-MVP enhancement.
- **Payment Application**: All payments are generic amounts against a tenant. No payment allocation to specific months.
- **Overpayment**: When payments exceed rent, balance displays as zero (status: paid). No credit tracking in MVP.
- **Historical Balances**: No balance history over time in MVP. Balance is always current snapshot.
- **Multiple Rooms**: Tenant assigned to single room at a time. Balance uses current room's rent.
- **Property Scoping**: Balance operations are scoped to the active property via `propertyId` in the URL path and validated by property access middleware.
