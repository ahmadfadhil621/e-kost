# Design: Payment Recording

## Overview

The Payment Recording feature enables property managers to record rent payments with essential details (tenant, amount, date) and view payment history through multiple interfaces. This feature serves as the single source of truth for payment records, supporting quick mobile entry and comprehensive payment tracking.

### Key Design Decisions

**Mobile-First Form Design**: The payment recording form is optimized for one-handed mobile use with a vertical layout, large touch targets (44x44px minimum), and minimal required fields (tenant, amount, date). The form fits within a single viewport on mobile devices to enable quick entry without scrolling.

**Immediate Persistence**: All payment records are persisted to the database immediately upon submission with UTC timestamps. No local-only state or delayed synchronization ensures data integrity and serves as a reliable audit trail.

**Dual View Strategy**: Payment data is surfaced in two primary contexts: (1) a global payment list showing all payments across tenants, and (2) per-tenant payment sections embedded in tenant detail views. Both views use mobile-optimized single-column layouts with descending date order (most recent first).

**Active Tenant Filtering**: The tenant selection dropdown displays only tenants with active room assignments (not moved out), preventing payment recording for inactive tenants and maintaining data quality.

**Language-Agnostic Design**: All user-facing text uses translation keys stored in JSON files (`locales/en.json`, `locales/id.json`). Currency formatting respects locale settings for decimal separators and currency symbols.

**Validation Strategy**: Multi-layer validation ensures data quality: client-side validation provides immediate feedback, server-side validation prevents invalid data persistence, and database constraints enforce data integrity at the storage layer.

## Architecture

### System Context

The Payment Recording feature integrates with the Tenant Management system and serves as a data source for the Outstanding Balance feature.

```mermaid
graph TB
    A[Mobile UI] --> B[Payment Recording]
    A --> C[Payment List View]
    A --> D[Per-Tenant Payment View]
    B --> E[API Routes]
    C --> E
    D --> E
    E --> F[Database Layer]
    F --> G[(PostgreSQL)]
    
    H[Tenant Management] -.provides tenant data.-> B
    I[Outstanding Balance] -.consumes payment data.-> F
```

### Component Architecture

```mermaid
graph LR
    A[UI Components] --> B[API Routes]
    B --> C[Service Layer]
    C --> D[Data Access Layer]
    D --> E[(Database)]
    
    A1[PaymentForm] --> A
    A2[PaymentList] --> A
    A3[TenantPaymentSection] --> A
    
    B1[/api/payments] --> B
    B2[/api/payments/:id] --> B
    B3[/api/tenants/:id/payments] --> B
    
    C1[PaymentService] --> C
    C2[ValidationService] --> C
```

### Data Flow: Payment Recording

```mermaid
sequenceDiagram
    participant UI as Mobile UI
    participant API as API Route
    participant Val as Validation
    participant DB as Database
    
    UI->>API: GET /api/tenants?hasRoom=true
    API->>DB: SELECT tenants WHERE room_id IS NOT NULL AND moved_out_at IS NULL
    DB-->>API: Active tenants list
    API-->>UI: 200 OK {tenants}
    UI->>UI: Display tenant dropdown
    
    UI->>API: POST /api/payments {tenantId, amount, paymentDate}
    API->>Val: Validate required fields and amount > 0
    Val-->>API: Valid
    API->>DB: INSERT payment record with UTC timestamp
    DB-->>API: Payment created (id, timestamp)
    API-->>UI: 201 Created {payment}
    UI->>UI: Display confirmation and clear form
```

### Data Flow: Payment List View

```mermaid
sequenceDiagram
    participant UI as Mobile UI
    participant API as API Route
    participant DB as Database
    
    UI->>API: GET /api/payments
    API->>DB: SELECT payments JOIN tenants ORDER BY payment_date DESC
    DB-->>API: Payments with tenant names
    API-->>UI: 200 OK {payments}
    UI->>UI: Render scrollable list
```

## Components and Interfaces

### 1. Payment Service

**Responsibility**: Business logic for payment CRUD operations, validation, and tenant filtering.

**Interface**:
```typescript
interface PaymentService {
  // Create a new payment record
  createPayment(data: CreatePaymentInput): Promise<Payment>;
  
  // Retrieve payment by ID
  getPayment(id: string): Promise<Payment | null>;
  
  // Retrieve all payments (global list)
  listPayments(filters?: PaymentFilters): Promise<Payment[]>;
  
  // Retrieve payments for a specific tenant
  listTenantPayments(tenantId: string): Promise<Payment[]>;
  
  // Get active tenants (for dropdown)
  getActiveTenants(): Promise<Tenant[]>;
}

interface CreatePaymentInput {
  tenantId: string;
  amount: number;
  paymentDate: string; // ISO 8601 date string
}

interface PaymentFilters {
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}

interface Payment {
  id: string;
  tenantId: string;
  tenantName: string; // Joined from tenants table
  amount: number;
  paymentDate: Date;
  createdAt: Date;
}

interface Tenant {
  id: string;
  name: string;
  roomNumber: string; // Joined from rooms table
}
```

### 2. API Routes

**POST /api/payments**
- Creates a new payment record
- Request body: `{tenantId, amount, paymentDate}`
- Response: 201 Created with payment object
- Validation: All fields required, amount must be positive, paymentDate must be valid date
- Side effect: Triggers balance recalculation for tenant

**GET /api/payments**
- Lists all recorded payments
- Query params: `?tenantId=uuid`, `?startDate=YYYY-MM-DD`, `?endDate=YYYY-MM-DD`
- Response: 200 OK with array of payments
- Includes tenant name and room number (joined data)
- Sorted by payment_date DESC (most recent first)

**GET /api/payments/:id**
- Retrieves a single payment by ID
- Response: 200 OK with payment object, or 404 Not Found
- Includes tenant name and room number

**GET /api/tenants/:id/payments**
- Lists all payments for a specific tenant
- Response: 200 OK with array of payments
- Sorted by payment_date DESC
- Includes total payment count

**GET /api/tenants?hasRoom=true**
- Lists active tenants with room assignments
- Used by payment form to populate tenant dropdown
- Response: 200 OK with array of tenants
- Filters: `moved_out_at IS NULL AND room_id IS NOT NULL`

### 3. UI Components

**PaymentForm Component**
- Purpose: Record a new payment
- Props: `{onSubmit, onSuccess}`
- Features:
  - Tenant selection dropdown (active tenants only)
  - Amount input (numeric, positive validation)
  - Payment date picker (defaults to today)
  - Submit button disabled until valid
  - Client-side validation with error messages
  - Mobile-optimized: vertical stack, 44x44px touch targets
  - Fits in single viewport without scrolling
  - Auto-clears form after successful submission
  - Translation keys for all labels and messages

**PaymentList Component**
- Purpose: Display all payments in scrollable list
- Props: `{payments: Payment[], onSelectPayment?}`
- Features:
  - Single-column card layout
  - Each card shows: tenant name, amount, payment date, recording timestamp
  - Mobile-optimized: full-width cards, adequate padding
  - Sorted by payment date DESC (most recent first)
  - Empty state message when no payments
  - Loading state during data fetch
  - Currency formatting with locale support

**TenantPaymentSection Component**
- Purpose: Display payments for a specific tenant
- Props: `{tenantId: string, payments: Payment[]}`
- Features:
  - Embedded in tenant detail view
  - Shows payment count header
  - Single-column list of payments
  - Each item shows: amount, payment date, recording timestamp
  - Sorted by payment date DESC
  - Empty state: "No payments recorded"
  - Mobile-optimized layout

**PaymentCard Component**
- Purpose: Reusable payment display card
- Props: `{payment: Payment, showTenant?: boolean}`
- Features:
  - Displays amount (large, prominent)
  - Displays payment date
  - Displays recording timestamp (smaller, secondary)
  - Optionally displays tenant name (for global list)
  - Currency formatting with locale support
  - Mobile-optimized: clear visual hierarchy

**TenantDropdown Component**
- Purpose: Select tenant for payment recording
- Props: `{tenants: Tenant[], value: string, onChange, error?: string}`
- Features:
  - Displays tenant name and room number
  - Sorted alphabetically by tenant name
  - Search/filter capability for large lists
  - Touch-optimized: 44x44px minimum height
  - Clear visual indication of selected tenant
  - Error state styling

## Data Models

### Database Schema

```sql
-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_payment_date CHECK (payment_date <= CURRENT_DATE)
);

-- Indexes for performance
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Composite index for tenant payment queries
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, payment_date DESC);
```

### Prisma Schema

```prisma
model Payment {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  amount      Decimal  @db.Decimal(10, 2)
  paymentDate DateTime @map("payment_date") @db.Date
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@index([tenantId])
  @@index([paymentDate(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([tenantId, paymentDate(sort: Desc)])
  @@map("payments")
}

// Extension to existing Tenant model
model Tenant {
  // ... existing fields ...
  payments    Payment[]
}
```

### Data Validation Rules

**Payment Validation**:
- `tenantId`: Required, must be valid UUID, must reference existing tenant with active room assignment
- `amount`: Required, must be positive number (> 0), maximum 2 decimal places
- `paymentDate`: Required, must be valid date, cannot be future date
- `createdAt`: Auto-generated, UTC timezone, immutable

**Business Rules**:
1. Payments can only be recorded for tenants with active room assignments
2. Payment amount must be positive (no negative or zero amounts)
3. Payment date cannot be in the future
4. Payment records are immutable after creation (no updates or deletes in MVP)
5. Recording timestamp is always in UTC timezone
6. Each payment has a unique identifier that cannot be modified

### Data Integrity Constraints

**Database-Level Constraints**:
- Foreign key: `payments.tenant_id` references `tenants.id` with RESTRICT on delete
- Check constraint: `amount > 0`
- Check constraint: `payment_date <= CURRENT_DATE`
- NOT NULL constraints on all required fields

**Application-Level Constraints**:
- Validate tenant has active room assignment before allowing payment
- Validate amount is positive with exactly 2 decimal places
- Validate payment date is valid calendar date and not in future
- Trim whitespace from all string inputs before validation

### Migration Strategy

**Initial Migration**:
```sql
-- Create payments table (depends on tenants table)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_payment_date CHECK (payment_date <= CURRENT_DATE)
);

-- Create indexes
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, payment_date DESC);
```

**Rollback Strategy**:
```sql
-- Drop payments table
DROP TABLE IF EXISTS payments CASCADE;
```

### Query Patterns

**List All Payments with Tenant Info**:
```sql
SELECT 
  p.id,
  p.tenant_id,
  t.name as tenant_name,
  r.room_number,
  p.amount,
  p.payment_date,
  p.created_at
FROM payments p
JOIN tenants t ON p.tenant_id = t.id
LEFT JOIN rooms r ON t.room_id = r.id
ORDER BY p.payment_date DESC, p.created_at DESC;
```

**List Payments for Specific Tenant**:
```sql
SELECT 
  p.id,
  p.amount,
  p.payment_date,
  p.created_at
FROM payments p
WHERE p.tenant_id = $1
ORDER BY p.payment_date DESC, p.created_at DESC;
```

**Get Active Tenants for Dropdown**:
```sql
SELECT 
  t.id,
  t.name,
  r.room_number
FROM tenants t
JOIN rooms r ON t.room_id = r.id
WHERE t.moved_out_at IS NULL
ORDER BY t.name ASC;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Active Tenant Filtering

*For any* set of tenants with various states (some with rooms, some without, some moved out), when displaying the tenant dropdown for payment recording, the system should include only tenants that have active room assignments and have not moved out.

**Validates: Requirements 1.2**

### Property 2: Payment Creation Round Trip

*For any* valid payment data (tenant ID, amount, payment date), when a payment is created and then immediately retrieved by its ID, the retrieved payment should contain all the originally submitted data plus a unique identifier and creation timestamp in UTC.

**Validates: Requirements 1.3, 1.6, 4.1, 4.2, 4.3, 4.4, 6.4**

### Property 3: Missing Field Validation

*For any* payment submission with one or more missing required fields (tenant ID, amount, or payment date), the system should reject the submission and return validation errors indicating which specific fields are missing.

**Validates: Requirements 1.4**

### Property 4: Positive Amount Validation

*For any* payment amount that is not a positive number (negative, zero, or non-numeric), the system should reject the submission and display an error indicating the amount must be positive.

**Validates: Requirements 1.5**

### Property 5: Payment List Display Completeness

*For any* payment in the global payment list, the rendered list item should include the tenant name, payment amount, payment date, and recording timestamp.

**Validates: Requirements 2.2**


### Property 6: Payment Sorting Order

*For any* list of payments (global or per-tenant), when displayed, the payments should be sorted by payment date in descending order, with the most recent payment appearing first.

**Validates: Requirements 2.4, 3.4**

### Property 7: Per-Tenant Payment Display

*For any* tenant with recorded payments, when viewing the tenant detail page, the system should display a section containing all payments recorded for that specific tenant.

**Validates: Requirements 3.1**

### Property 8: Per-Tenant Payment Item Completeness

*For any* payment in the per-tenant payment section, the rendered item should include the payment amount, payment date, and recording timestamp.

**Validates: Requirements 3.2**

### Property 9: Payment Count Accuracy

*For any* tenant, when viewing the per-tenant payment section, the displayed payment count should equal the actual number of payment records for that tenant in the database.

**Validates: Requirements 3.5**

### Property 10: UTC Timestamp Format

*For any* payment record, the creation timestamp should be stored and retrieved in UTC timezone format.

**Validates: Requirements 4.5**

### Property 11: Form Clearing After Submission

*For any* successful payment submission, the form fields (tenant selection, amount, payment date) should be cleared to their initial empty state, ready for the next entry.

**Validates: Requirements 6.5**


## Error Handling

### Validation Errors

**Missing Required Fields**:
- Scenario: Payment submission with empty tenant, amount, or payment date
- Handling: Return 400 Bad Request with field-specific error messages
- Response format: `{errors: {tenantId: "Tenant is required", amount: "Amount is required"}}`
- UI: Display inline error messages below each invalid field

**Invalid Amount**:
- Scenario: Amount is negative, zero, or non-numeric
- Handling: Return 400 Bad Request with validation error
- Message: "Amount must be a positive number"
- UI: Display error message below amount field

**Invalid Payment Date**:
- Scenario: Payment date is not a valid date or is in the future
- Handling: Return 400 Bad Request with validation error
- Message: "Payment date must be a valid date and cannot be in the future"
- UI: Display error message below date field

**Invalid Tenant ID**:
- Scenario: Tenant ID is not a valid UUID or doesn't exist
- Handling: Return 400 Bad Request or 404 Not Found
- Message: "Invalid tenant ID" or "Tenant not found"
- UI: Should not occur in normal usage (tenants selected from dropdown)


### Business Rule Violations

**Tenant Has No Room Assignment**:
- Scenario: Attempting to record payment for tenant without active room
- Handling: Return 409 Conflict
- Message: "Cannot record payment: tenant has no active room assignment"
- UI: Should not occur if tenant dropdown filters correctly

**Tenant Moved Out**:
- Scenario: Attempting to record payment for moved-out tenant
- Handling: Return 409 Conflict
- Message: "Cannot record payment: tenant has moved out"
- UI: Should not occur if tenant dropdown filters correctly

**Payment Not Found**:
- Scenario: Attempting to retrieve non-existent payment
- Handling: Return 404 Not Found
- Message: "Payment not found"
- UI: Display "Payment not found" message

### Database Errors

**Connection Failure**:
- Scenario: Database connection timeout or network error
- Handling: Return 503 Service Unavailable
- Retry: Implement exponential backoff (3 retries max)
- UI: Display "Service temporarily unavailable" with retry button

**Constraint Violation**:
- Scenario: Foreign key violation (invalid tenant_id)
- Handling: Return 409 Conflict
- Message: "Invalid tenant reference"
- UI: Display error message with guidance

**Transaction Failure**:
- Scenario: Payment insertion fails mid-operation
- Handling: Rollback transaction, return 500 Internal Server Error
- Logging: Log full error details for debugging
- UI: Display generic error message with retry option


### Network Errors

**Request Timeout**:
- Scenario: API request takes longer than 30 seconds
- Handling: Client-side timeout, cancel request
- UI: Display timeout message with retry button

**Network Disconnection**:
- Scenario: User loses internet connection during operation
- Handling: Display offline indicator
- UI: Display "No internet connection" message
- MVP: No offline queue (future enhancement)

### Translation Errors

**Missing Translation Key**:
- Scenario: Translation key not found in locale file
- Handling: Fall back to English key or display key name
- Logging: Log missing key for developer attention
- UI: Display fallback text without breaking layout

**Locale File Load Failure**:
- Scenario: Unable to load locale JSON file
- Handling: Fall back to default locale (English)
- Logging: Log error for investigation
- UI: Display content in default language

### Data Integrity Issues

**Orphaned Payment**:
- Scenario: Payment references deleted tenant (should not occur with RESTRICT)
- Handling: Database constraint prevents deletion
- Prevention: ON DELETE RESTRICT on foreign key
- UI: Cannot delete tenant with payments

**Decimal Precision Loss**:
- Scenario: Amount with more than 2 decimal places
- Handling: Round to 2 decimal places or reject
- Validation: Client-side validation limits to 2 decimals
- Database: DECIMAL(10,2) enforces precision


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Example: Recording a payment with valid data returns 201 status
- Example: Recording a payment with missing amount returns 400 status
- Edge case: Recording payment for tenant without room returns 409 status
- Integration: API route correctly calls service layer and returns proper response

**Property-Based Tests**: Verify universal properties across all inputs
- Property tests handle comprehensive input coverage through randomization
- Each property test runs minimum 100 iterations
- Properties validate correctness across the full input space

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
```typescript
import fc from 'fast-check';

// Minimum 100 iterations per property test
fc.assert(property, { numRuns: 100 });
```


**Test Tagging**: Each property test must include a comment referencing the design property:
```typescript
// Feature: payment-recording, Property 2: Payment Creation Round Trip
test('payment creation and retrieval preserves all data', () => {
  fc.assert(
    fc.property(
      paymentDataArbitrary,
      async (paymentData) => {
        const created = await createPayment(paymentData);
        expect(created.id).toBeDefined();
        expect(created.createdAt).toBeInstanceOf(Date);
        
        // Verify persistence
        const retrieved = await getPayment(created.id);
        expect(retrieved.tenantId).toBe(paymentData.tenantId);
        expect(retrieved.amount).toBe(paymentData.amount);
        expect(retrieved.paymentDate).toEqual(paymentData.paymentDate);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Data Generators

**Payment Data Generator**:
```typescript
const paymentDataArbitrary = fc.record({
  tenantId: fc.uuid(),
  amount: fc.float({ min: 0.01, max: 100000, noNaN: true })
    .map(n => Math.round(n * 100) / 100), // 2 decimal places
  paymentDate: fc.date({ max: new Date() }) // Not in future
});
```


**Payment Generator** (with ID):
```typescript
const paymentArbitrary = fc.record({
  id: fc.uuid(),
  tenantId: fc.uuid(),
  tenantName: fc.string({ minLength: 1, maxLength: 100 }),
  amount: fc.float({ min: 0.01, max: 100000 })
    .map(n => Math.round(n * 100) / 100),
  paymentDate: fc.date(),
  createdAt: fc.date()
});
```

**Active Tenant Generator**:
```typescript
const activeTenantArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  roomId: fc.uuid(), // Must have room
  roomNumber: fc.string({ minLength: 1, maxLength: 20 }),
  movedOutAt: fc.constant(null) // Not moved out
});
```

**Invalid Amount Generator**:
```typescript
const invalidAmountArbitrary = fc.oneof(
  fc.constant(0),
  fc.constant(-1),
  fc.float({ max: -0.01 }),
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity)
);
```

**Future Date Generator**:
```typescript
const futureDateArbitrary = fc.date({ 
  min: new Date(Date.now() + 86400000) // Tomorrow onwards
});
```


### Test Coverage Requirements

**Unit Tests** (30-50 tests):
- Payment creation: valid data, missing fields, invalid amount (5-8 tests)
- Payment retrieval: by ID, list all, filter by tenant (3-5 tests)
- Active tenant filtering: with/without rooms, moved out (3-5 tests)
- API routes: request/response format, status codes (8-12 tests)
- UI components: rendering, user interactions (10-15 tests)

**Property-Based Tests** (11 tests):
- One test per correctness property
- Each test runs 100+ iterations
- Covers full input space through randomization

**Integration Tests** (5-8 tests):
- End-to-end payment recording flow
- End-to-end payment list retrieval
- End-to-end per-tenant payment view
- Database persistence verification
- Form validation and submission

### Mobile Testing

**Responsive Design Testing**:
- Test layouts at 320px, 375px, 414px, 480px widths
- Verify single-column layout at all breakpoints
- Verify no horizontal scrolling required
- Use browser DevTools device emulation

**Touch Target Testing**:
- Measure rendered button and input dimensions
- Verify all interactive elements are 44x44px minimum
- Test with touch event simulation


**Accessibility Testing**:
- Test with screen readers (VoiceOver, TalkBack)
- Verify all form fields have associated labels
- Verify color contrast meets WCAG AA standards
- Test keyboard navigation

### Performance Testing

**Response Time Testing**:
- Measure API response times for all endpoints
- Verify payment creation completes in <2 seconds
- Verify payment list loads in <2 seconds with 10,000 records
- Verify per-tenant payment view loads in <2 seconds

**Load Testing**:
- Test with 10,000 payment records
- Test with 1,000 tenant records
- Verify list rendering performance
- Verify filter/sort performance

**Database Performance**:
- Measure query execution times
- Verify indexed queries complete in <100ms
- Test JOIN performance for payment list with tenant names
- Monitor connection pool usage

### Internationalization Testing

**Translation Coverage**:
- Verify all UI text uses translation keys
- Test language switching (English ↔ Indonesian)
- Verify no hardcoded strings in components
- Test with missing translation keys (fallback behavior)

**Locale Formatting**:
- Test date formatting in different locales
- Test currency formatting (decimal separators)
- Test number formatting with locale-specific rules


## Implementation Notes

### Technology Stack Integration

**Frontend**:
- React 18 with TypeScript for type safety
- Vite for fast development and optimized builds
- Tailwind CSS for mobile-first styling
- shadcn/ui for accessible form components
- React Hook Form for form state management
- Zod for client-side validation
- react-i18next for internationalization
- React Query (TanStack Query) for data fetching and caching
- date-fns for date manipulation and formatting

**Backend**:
- Next.js 14 API routes for serverless functions
- Prisma ORM for type-safe database access
- Zod for request/response validation (shared with frontend)
- PostgreSQL for data persistence

**Database**:
- Supabase (managed PostgreSQL)
- Connection pooling via PgBouncer
- Automatic backups and point-in-time recovery

### Mobile-First CSS Implementation

**Tailwind Configuration**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '480px',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    }
  }
}
```


**Component Styling Example**:
```tsx
// PaymentCard component
<div className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-sm w-full">
  <div className="flex justify-between items-start">
    <span className="text-sm text-gray-600">{tenantName}</span>
    <span className="text-lg font-bold text-green-600">
      {formatCurrency(amount)}
    </span>
  </div>
  <div className="flex justify-between text-sm text-gray-500">
    <span>{formatDate(paymentDate)}</span>
    <span>{formatTimestamp(createdAt)}</span>
  </div>
</div>
```

### Form Validation Implementation

**Zod Schema** (shared between frontend and backend):
```typescript
import { z } from 'zod';

export const createPaymentSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places')
    .max(999999.99, 'Amount exceeds maximum'),
  paymentDate: z.string()
    .datetime()
    .refine(
      (date) => new Date(date) <= new Date(),
      'Payment date cannot be in the future'
    )
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
```


**React Hook Form Integration**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function PaymentForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      tenantId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0]
    }
  });
  
  const onSubmit = async (data: CreatePaymentInput) => {
    await createPayment(data);
    reset(); // Clear form after success
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('payment.create.tenant')}
        </label>
        <select {...register('tenantId')} className="w-full min-h-[44px]">
          <option value="">{t('payment.create.selectTenant')}</option>
          {activeTenants.map(tenant => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} - {tenant.roomNumber}
            </option>
          ))}
        </select>
        {errors.tenantId && (
          <span className="text-red-600 text-sm">{errors.tenantId.message}</span>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('payment.create.amount')}
        </label>
        <input 
          type="number" 
          step="0.01"
          {...register('amount', { valueAsNumber: true })} 
          className="w-full min-h-[44px] px-3 border rounded"
        />
        {errors.amount && (
          <span className="text-red-600 text-sm">{errors.amount.message}</span>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('payment.create.date')}
        </label>
        <input 
          type="date" 
          {...register('paymentDate')} 
          className="w-full min-h-[44px] px-3 border rounded"
        />
        {errors.paymentDate && (
          <span className="text-red-600 text-sm">{errors.paymentDate.message}</span>
        )}
      </div>
      
      <button 
        type="submit" 
        className="min-h-[44px] bg-blue-600 text-white rounded font-medium"
      >
        {t('payment.create.submit')}
      </button>
    </form>
  );
}
```


### Internationalization Implementation

**Translation Files Structure**:
```
locales/
├── en.json
└── id.json
```

**English Translation File** (`locales/en.json`):
```json
{
  "payment": {
    "create": {
      "title": "Record Payment",
      "tenant": "Tenant",
      "selectTenant": "Select a tenant",
      "amount": "Payment Amount",
      "date": "Payment Date",
      "submit": "Record Payment",
      "success": "Payment recorded successfully"
    },
    "list": {
      "title": "Payment History",
      "empty": "No payments recorded",
      "tenant": "Tenant",
      "amount": "Amount",
      "date": "Payment Date",
      "recorded": "Recorded"
    },
    "tenantSection": {
      "title": "Payment History",
      "count": "{{count}} payment(s) recorded",
      "empty": "No payments recorded for this tenant"
    },
    "validation": {
      "tenantRequired": "Tenant is required",
      "amountRequired": "Amount is required",
      "amountPositive": "Amount must be positive",
      "dateRequired": "Payment date is required",
      "dateFuture": "Payment date cannot be in the future"
    },
    "errors": {
      "noRoom": "Cannot record payment: tenant has no room assignment",
      "movedOut": "Cannot record payment: tenant has moved out",
      "notFound": "Payment not found",
      "loadFailed": "Failed to load payment data"
    }
  }
}
```


**Indonesian Translation File** (`locales/id.json`):
```json
{
  "payment": {
    "create": {
      "title": "Catat Pembayaran",
      "tenant": "Penyewa",
      "selectTenant": "Pilih penyewa",
      "amount": "Jumlah Pembayaran",
      "date": "Tanggal Pembayaran",
      "submit": "Catat Pembayaran",
      "success": "Pembayaran berhasil dicatat"
    },
    "list": {
      "title": "Riwayat Pembayaran",
      "empty": "Belum ada pembayaran tercatat",
      "tenant": "Penyewa",
      "amount": "Jumlah",
      "date": "Tanggal Pembayaran",
      "recorded": "Dicatat"
    },
    "tenantSection": {
      "title": "Riwayat Pembayaran",
      "count": "{{count}} pembayaran tercatat",
      "empty": "Belum ada pembayaran untuk penyewa ini"
    },
    "validation": {
      "tenantRequired": "Penyewa wajib dipilih",
      "amountRequired": "Jumlah wajib diisi",
      "amountPositive": "Jumlah harus positif",
      "dateRequired": "Tanggal pembayaran wajib diisi",
      "dateFuture": "Tanggal pembayaran tidak boleh di masa depan"
    },
    "errors": {
      "noRoom": "Tidak dapat mencatat pembayaran: penyewa tidak memiliki kamar",
      "movedOut": "Tidak dapat mencatat pembayaran: penyewa sudah pindah",
      "notFound": "Pembayaran tidak ditemukan",
      "loadFailed": "Gagal memuat data pembayaran"
    }
  }
}
```


**Currency Formatting with Locale Support**:
```typescript
import { useTranslation } from 'react-i18next';

function formatCurrency(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IDR', // Indonesian Rupiah
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Usage in component
function PaymentCard({ payment }: { payment: Payment }) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  
  return (
    <div>
      <span>{formatCurrency(payment.amount, locale)}</span>
    </div>
  );
}
```

**Date Formatting with Locale Support**:
```typescript
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';

function formatDate(date: Date, locale: string = 'en'): string {
  const localeObj = locale === 'id' ? id : enUS;
  return format(date, 'PPP', { locale: localeObj });
}

function formatTimestamp(date: Date, locale: string = 'en'): string {
  const localeObj = locale === 'id' ? id : enUS;
  return format(date, 'PPp', { locale: localeObj });
}
```


### API Route Implementation

**POST /api/payments**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createPaymentSchema.parse(body);
    
    // Verify tenant has active room assignment
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      select: { roomId: true, movedOutAt: true }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    if (!tenant.roomId) {
      return NextResponse.json(
        { error: 'Cannot record payment: tenant has no room assignment' },
        { status: 409 }
      );
    }
    
    if (tenant.movedOutAt) {
      return NextResponse.json(
        { error: 'Cannot record payment: tenant has moved out' },
        { status: 409 }
      );
    }
    
    // Create payment
    const payment = await prisma.payment.create({
      data: {
        tenantId: data.tenantId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate)
      },
      include: {
        tenant: {
          select: {
            name: true,
            room: {
              select: {
                roomNumber: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      id: payment.id,
      tenantId: payment.tenantId,
      tenantName: payment.tenant.name,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```


**GET /api/payments**:
```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const where: any = {};
    
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }
    
    const payments = await prisma.payment.findMany({
      where,
      include: {
        tenant: {
          select: {
            name: true,
            room: {
              select: {
                roomNumber: true
              }
            }
          }
        }
      },
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return NextResponse.json(
      payments.map(p => ({
        id: p.id,
        tenantId: p.tenantId,
        tenantName: p.tenant.name,
        roomNumber: p.tenant.room?.roomNumber,
        amount: p.amount,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```


**GET /api/tenants/:id/payments**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payments = await prisma.payment.findMany({
      where: { tenantId: params.id },
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return NextResponse.json({
      payments,
      count: payments.length
    }, { status: 200 });
  } catch (error) {
    console.error('Tenant payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Client-Side Data Fetching with React Query

**Payment Queries**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch all payments
function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => fetchPayments(filters),
    staleTime: 30000 // 30 seconds
  });
}

// Fetch payments for specific tenant
function useTenantPayments(tenantId: string) {
  return useQuery({
    queryKey: ['payments', 'tenant', tenantId],
    queryFn: () => fetchTenantPayments(tenantId),
    staleTime: 30000
  });
}

// Create payment mutation
function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      // Invalidate and refetch payment lists
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      // Also invalidate balance queries since payment affects balance
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    }
  });
}
```


### Performance Optimization

**Query Optimization**:
```typescript
// Include tenant and room data to avoid N+1 problem
const payments = await prisma.payment.findMany({
  include: {
    tenant: {
      select: {
        name: true,
        room: {
          select: {
            roomNumber: true
          }
        }
      }
    }
  }
});
```

**Pagination for Large Lists**:
```typescript
const PAGE_SIZE = 50;

async function listPayments(page: number = 1, filters?: PaymentFilters) {
  const where = buildWhereClause(filters);
  
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        tenant: {
          select: { name: true, room: { select: { roomNumber: true } } }
        }
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.payment.count({ where })
  ]);
  
  return {
    payments,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE)
  };
}
```


**Index Usage**:
```sql
-- Composite index for tenant payment queries
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, payment_date DESC);

-- This index supports queries like:
-- SELECT * FROM payments WHERE tenant_id = ? ORDER BY payment_date DESC;

-- Separate index for global payment list
CREATE INDEX idx_payments_payment_date ON payments(payment_date DESC);

-- This index supports queries like:
-- SELECT * FROM payments ORDER BY payment_date DESC;
```

### Security Considerations

**Input Sanitization**:
- All numeric inputs validated for positive values
- Date inputs validated for valid dates and not future
- UUID validation prevents SQL injection
- Zod schema validation on both client and server

**SQL Injection Prevention**:
- Prisma uses parameterized queries automatically
- No raw SQL queries in MVP
- All user inputs validated before database operations

**Authorization**:
- Supabase Auth enforces authenticated access to all payment endpoints
- Implement row-level security in Supabase to scope data to authenticated user
- Verify user has permission to record payments
- Audit log for all payment operations

**Data Integrity**:
- Foreign key constraints prevent orphaned payments
- Check constraints enforce positive amounts
- Immutable payment records (no updates/deletes in MVP)


### Deployment Considerations

**Database Migration**:
```bash
# Generate migration
npx prisma migrate dev --name add_payments_table

# Apply migration to production
npx prisma migrate deploy
```

**Environment Variables**:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXT_PUBLIC_API_URL="https://api.example.com"
```

**Vercel Deployment**:
- Automatic deployment on git push
- Environment variables configured in Vercel dashboard
- Database connection pooling via Supabase
- Serverless function timeout: 10 seconds (sufficient for payment operations)

**Monitoring**:
- Track API response times for payment endpoints
- Monitor database query performance
- Alert on error rates exceeding threshold
- Log all validation errors for analysis
- Track payment creation success rate

**Data Backup**:
- Supabase automatic daily backups
- 7-day backup retention on free tier
- Point-in-time recovery available
- Manual backup before major migrations


## Future Enhancements

**Out of Scope for MVP**:
- Payment editing or deletion (immutable in MVP)
- Payment method tracking (cash, check, transfer, bank)
- Receipt generation and printing
- Payment reminders or notifications
- Automated payment processing or online collection
- Integration with banking systems or accounting software
- Multi-currency support
- Recurring payment automation
- Partial payment tracking
- Payment notes or memo fields
- Payment attachments (receipts, invoices)
- Payment approval workflow
- Bulk payment import from CSV/Excel
- Payment export to accounting software
- Payment analytics and reporting
- Payment search and advanced filtering
- Payment categories or tags

**Post-MVP Considerations**:
- Real-time payment updates using Supabase Realtime
- Offline payment recording with sync when online
- Payment receipt generation (PDF)
- Payment method dropdown (cash, transfer, check)
- Payment notes field for additional context
- Payment editing with audit trail
- Payment deletion with soft delete pattern
- Payment search by amount, date range, tenant
- Payment analytics dashboard
- Payment export to CSV/PDF
- Integration with Indonesian payment gateways (GoPay, OVO, Dana)
- Automated rent calculation and payment matching
- Payment reminders via SMS or WhatsApp
- Payment confirmation notifications to tenants
- Multi-property payment tracking
- Payment reconciliation with bank statements

