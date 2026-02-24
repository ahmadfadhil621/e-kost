# Requirements: Outstanding Balance per Tenant

## Context & Problem

Property managers need to quickly identify which tenants are behind on rent payments and by how much. Without a clear calculation and display of outstanding balances, managers cannot easily determine who owes money, leading to missed revenue, difficulty prioritizing collection efforts, and inability to make informed decisions about tenant status on mobile devices.

## Goals

- Calculate outstanding balance for each tenant based on expected rent versus recorded payments
- Display outstanding balance prominently in tenant summaries for quick reference
- Use color-coded status indicators to visually distinguish payment status at phone scale
- Enable managers to quickly identify tenants with outstanding balances
- Deliver a mobile-optimized interface with glanceable information

## Non-Goals

- Payment collection workflows or dunning processes
- Late fee calculation or interest accrual
- Automated payment reminders or notifications
- Partial payment tracking or payment plans
- Historical balance tracking or aging reports
- Integration with accounting systems
- Multi-currency support

## Functional Requirements

### Requirement 1: Outstanding Balance Calculation

**User Story:** As a property manager, I want the system to calculate outstanding balance for each tenant, so that I know exactly how much each tenant owes.

#### Acceptance Criteria

1. WHEN the system calculates outstanding balance for a tenant, THE System SHALL determine the expected rent amount based on the tenant's assigned room's monthly rent
2. WHEN the system calculates outstanding balance for a tenant, THE System SHALL sum all recorded payments for that tenant
3. WHEN the system calculates outstanding balance for a tenant, THE System SHALL compute the difference as: expected rent minus total payments
4. WHEN a tenant has no recorded payments, THE System SHALL display outstanding balance equal to the monthly rent amount
5. WHEN a tenant's total payments equal or exceed the expected rent, THE System SHALL display outstanding balance as zero or paid status
6. WHEN the system calculates outstanding balance, THE System SHALL update the calculation whenever tenant room assignment or payment records change

### Requirement 2: Outstanding Balance Display in Tenant Summary

**User Story:** As a property manager, I want to see outstanding balance displayed in the tenant detail view, so that I can quickly check payment status for any tenant.

#### Acceptance Criteria

1. WHEN a manager views a tenant detail page, THE System SHALL display the outstanding balance prominently in a dedicated section
2. WHEN a manager views the outstanding balance section, THE System SHALL display the calculated balance amount in a clear, readable format
3. WHEN a manager views the outstanding balance section, THE System SHALL display the monthly rent amount for reference
4. WHEN a manager views the outstanding balance section, THE System SHALL display the total payments recorded for that tenant
5. WHEN a manager views the outstanding balance on a mobile device, THE System SHALL ensure the balance information is visible without requiring scrolling beyond the initial viewport

### Requirement 3: Color-Coded Status Indicators

**User Story:** As a property manager, I want visual status indicators for payment status, so that I can quickly identify tenants with outstanding balances at a glance.

#### Acceptance Criteria

1. WHEN a manager views a tenant with zero outstanding balance, THE System SHALL display a green status indicator or label indicating paid status
2. WHEN a manager views a tenant with outstanding balance greater than zero, THE System SHALL display a red status indicator or label indicating unpaid status
3. WHEN a manager views a tenant list or summary, THE System SHALL display status indicators alongside tenant names for quick visual scanning
4. WHEN a manager views status indicators on a mobile device, THE System SHALL ensure colors and icons are clearly distinguishable at phone scale without requiring magnification
5. WHEN a manager views status indicators, THE System SHALL use both color and text/icon to convey status (not color alone) for accessibility

### Requirement 4: Outstanding Balance in Tenant List

**User Story:** As a property manager, I want to see outstanding balance information in the tenant list view, so that I can quickly identify which tenants owe money without opening individual records.

#### Acceptance Criteria

1. WHEN a manager views the tenant list, THE System SHALL display each tenant with their outstanding balance amount visible
2. WHEN a manager views the tenant list, THE System SHALL display a status indicator (color-coded) for each tenant showing payment status
3. WHEN a manager views the tenant list on a mobile device, THE System SHALL render tenant cards in a single-column layout with balance and status information visible without horizontal scrolling
4. WHEN a manager views the tenant list, THE System SHALL sort or group tenants to prioritize those with outstanding balances (optional sorting feature)
5. WHEN a manager views tenant cards, THE System SHALL ensure balance amounts and status indicators are readable at phone scale

### Requirement 5: Outstanding Balance Accuracy

**User Story:** As a property manager, I want outstanding balance calculations to be accurate and current, so that I can rely on the information for decision-making.

#### Acceptance Criteria

1. WHEN a payment is recorded for a tenant, THE System SHALL immediately recalculate and update that tenant's outstanding balance
2. WHEN a tenant is assigned to a different room, THE System SHALL immediately recalculate outstanding balance based on the new room's monthly rent
3. WHEN a tenant is moved out, THE System SHALL preserve the outstanding balance calculation for historical reference
4. WHEN the system displays outstanding balance, THE System SHALL ensure the calculation reflects all recorded payments up to the current moment
5. WHEN a manager views outstanding balance after recording a payment, THE System SHALL display the updated balance within 2 seconds

### Requirement 6: Mobile Optimization

**User Story:** As a property manager using a smartphone, I want outstanding balance information optimized for mobile viewing, so that I can quickly check payment status while on-site.

#### Acceptance Criteria

1. WHEN a manager views outstanding balance information on a mobile device, THE System SHALL display all relevant information in a single-column layout with no horizontal scrolling required
2. WHEN a manager views status indicators on mobile, THE System SHALL use colors, icons, and text labels that are clearly distinguishable at phone scale
3. WHEN a manager views outstanding balance amounts on mobile, THE System SHALL use font sizes and contrast that ensure readability without magnification
4. WHEN a manager views the tenant list on mobile, THE System SHALL display balance and status information in a glanceable format (e.g., card layout with prominent indicators)
5. WHEN a manager views the interface on screens smaller than 480px width, THE System SHALL maintain readability and usability without requiring pinch-to-zoom

## Constraints

- Outstanding balance calculations must be based only on expected monthly rent and recorded payments
- The system must recalculate outstanding balance immediately when payments are recorded or room assignments change
- Outstanding balance must be displayed with at least two decimal places for currency amounts
- All calculations must use the monthly rent amount from the tenant's currently assigned room
- The system must support at least 1,000 tenant records with real-time balance calculations without performance degradation
- Status indicators must use both color and text/icon for accessibility (not color alone)
- The interface must function on mobile devices with screen widths from 320px to 480px
- Outstanding balance calculations must be accurate to the nearest currency unit (no rounding errors)
- All user-facing text must be externalized via translation keys (see cross-cutting-constraints.md)
- Language can be changed by updating a single JSON file without code changes
- Currency formatting must respect locale (decimal separators, currency symbols)

## Success Criteria

- A manager can view outstanding balance for any tenant in fewer than 5 seconds
- A manager can identify tenants with outstanding balances at a glance from the tenant list
- Outstanding balance updates within 2 seconds after a payment is recorded
- Outstanding balance updates within 2 seconds after a room assignment changes
- Status indicators are visually distinct and recognizable at phone scale
- All balance information is readable on mobile devices without magnification
- Balance calculations are accurate and reflect all recorded payments
- Color-coded indicators use both color and text/icon for accessibility
