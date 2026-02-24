# Design: Tenant & Room Basics (CRUD)

## Overview

The Tenant & Room Basics feature provides the foundational CRUD operations for managing tenant information and room assignments in E-Kost. This feature enables property managers to create tenant records, assign tenants to rooms, update tenant information, and handle move-out workflows—all through a mobile-optimized interface.

### Key Design Decisions

**Mobile-First Architecture**: All UI components are designed with a single-column layout optimized for 320px-480px screen widths. Touch targets meet the 44x44px minimum requirement, and all interactions are optimized for touch input rather than mouse/keyboard.

**Soft Delete Pattern**: Tenant move-out operations use soft deletion (setting `moved_out_at` timestamp) rather than hard deletion. This preserves historical data for reporting and audit purposes while freeing rooms for reassignment.

**Immediate Persistence**: All CRUD operations persist to the database immediately upon user action, with confirmation feedback within 2 seconds. No local-only state or delayed synchronization.

**Language-Agnostic Design**: All user-facing text uses translation keys stored in JSON files (`locales/en.json`, `locales/id.json`). Changing language requires only updating the active locale, not code changes.

**Room Availability Validation**: The system enforces business rules at both the API and database levels: only one tenant can occupy a room at a time, and room assignment displays only available rooms.

## Architecture

### System Context

The Tenant & Room Basics feature serves as the foundation for other E-Kost features. It provides the core data entities (tenants, rooms) that payment recording and balance calculation depend on.

```mermaid
graph TB
    A[Mobile UI] --> B[Tenant Management]
    A --> C[Room Assignment]
    B --> D[API Routes]
    C --> D
    D --> E[Database Layer]
    E --> F[(PostgreSQL)]
    
    G[Payment Recording] -.depends on.-> B
    H[Outstanding Balance] -.depends on.-> B
    H -.depends on.-> C
```

### Component Architecture

```mermaid
graph LR
    A[UI Components] --> B[API Routes]
    B --> C[Service Layer]
    C --> D[Data Access Layer]
    D --> E[(Database)]
    
    A1[TenantForm] --> A
    A2[TenantList] --> A
    A3[TenantDetail] --> A
    A4[RoomAssignment] --> A
    
    B1[/api/tenants] --> B
    B2[/api/tenants/:id] --> B
    B3[/api/tenants/:id/assign-room] --> B
    B4[/api/tenants/:id/move-out] --> B
    
    C1[TenantService] --> C
    C2[RoomService] --> C
    C3[ValidationService] --> C
```

### Data Flow: Tenant Creation

```mermaid
sequenceDiagram
    participant UI as Mobile UI
    participant API as API Route
    participant Val as Validation
    participant DB as Database
    
    UI->>API: POST /api/tenants {name, phone, email}
    API->>Val: Validate required fields
    Val-->>API: Valid
    API->>DB: INSERT tenant record
    DB-->>API: Tenant created (id, timestamp)
    API-->>UI: 201 Created {tenant}
    UI->>UI: Display confirmation
```

### Data Flow: Room Assignment

```mermaid
sequenceDiagram
    participant UI as Mobile UI
    participant API as API Route
    participant DB as Database
    
    UI->>API: GET /api/rooms?status=available
    API->>DB: SELECT rooms WHERE status='available'
    DB-->>API: Available rooms list
    API-->>UI: 200 OK {rooms}
    UI->>UI: Display room selection
    UI->>API: POST /api/tenants/:id/assign-room {roomId}
    API->>DB: BEGIN TRANSACTION
    API->>DB: UPDATE tenants SET room_id=:roomId
    API->>DB: UPDATE rooms SET status='occupied'
    API->>DB: COMMIT TRANSACTION
    DB-->>API: Success
    API-->>UI: 200 OK {tenant}
    UI->>UI: Display confirmation
```

## Components and Interfaces

### 1. Tenant Service

**Responsibility**: Business logic for tenant CRUD operations, validation, and room assignment.

**Interface**:
```typescript
interface TenantService {
  // Create a new tenant
  createTenant(data: CreateTenantInput): Promise<Tenant>;
  
  // Retrieve tenant by ID
  getTenant(id: string): Promise<Tenant | null>;
  
  // Retrieve all active tenants (not moved out)
  listTenants(filters?: TenantFilters): Promise<Tenant[]>;
  
  // Update tenant information
  updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant>;
  
  // Assign tenant to a room
  assignRoom(tenantId: string, roomId: string): Promise<Tenant>;
  
  // Mark tenant as moved out (soft delete)
  moveOut(tenantId: string): Promise<Tenant>;
}

interface CreateTenantInput {
  name: string;
  phone: string;
  email: string;
}

interface UpdateTenantInput {
  name?: string;
  phone?: string;
  email?: string;
}

interface TenantFilters {
  hasRoom?: boolean;
  roomId?: string;
}

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  roomId: string | null;
  createdAt: Date;
  updatedAt: Date;
  movedOutAt: Date | null;
}
```

### 2. Room Service

**Responsibility**: Business logic for room availability and status management.

**Interface**:
```typescript
interface RoomService {
  // Get available rooms (not occupied)
  getAvailableRooms(): Promise<Room[]>;
  
  // Get room by ID
  getRoom(id: string): Promise<Room | null>;
  
  // Update room status
  updateRoomStatus(id: string, status: RoomStatus): Promise<Room>;
}

type RoomStatus = 'available' | 'occupied' | 'under_renovation';

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
  status: RoomStatus;
  createdAt: Date;
}
```

### 3. API Routes

**POST /api/tenants**
- Creates a new tenant record
- Request body: `{name, phone, email}`
- Response: 201 Created with tenant object
- Validation: All fields required, email format validated

**GET /api/tenants**
- Lists all active tenants (not moved out)
- Query params: `?hasRoom=true|false`, `?roomId=uuid`
- Response: 200 OK with array of tenants
- Includes room information if assigned

**GET /api/tenants/:id**
- Retrieves a single tenant by ID
- Response: 200 OK with tenant object, or 404 Not Found
- Includes room information if assigned

**PUT /api/tenants/:id**
- Updates tenant information
- Request body: `{name?, phone?, email?}`
- Response: 200 OK with updated tenant
- Validation: Email format if provided

**POST /api/tenants/:id/assign-room**
- Assigns tenant to a room
- Request body: `{roomId}`
- Response: 200 OK with updated tenant
- Validation: Room must be available, tenant must not already have a room

**POST /api/tenants/:id/move-out**
- Marks tenant as moved out
- Request body: empty or `{moveOutDate?}`
- Response: 200 OK with updated tenant
- Side effect: Room status changed to 'available'

**GET /api/rooms**
- Lists rooms with optional filtering
- Query params: `?status=available|occupied|under_renovation`
- Response: 200 OK with array of rooms

### 4. UI Components

**TenantForm Component**
- Purpose: Create or edit tenant information
- Props: `{mode: 'create' | 'edit', initialData?: Tenant, onSubmit, onCancel}`
- Features:
  - Form fields: name (text), phone (tel), email (email)
  - Client-side validation with error messages
  - Submit button disabled until valid
  - Mobile-optimized: vertical stack, 44x44px touch targets
  - Translation keys for all labels and messages

**TenantList Component**
- Purpose: Display all tenants in scrollable list
- Props: `{tenants: Tenant[], onSelectTenant}`
- Features:
  - Single-column card layout
  - Each card shows: name, room number (if assigned)
  - Touch-optimized: full-width cards, adequate padding
  - Empty state message when no tenants
  - Loading state during data fetch

**TenantDetail Component**
- Purpose: Display full tenant information
- Props: `{tenant: Tenant, onEdit, onMoveOut, onAssignRoom}`
- Features:
  - Displays: name, phone, email, room assignment, creation date
  - Action buttons: Edit, Assign Room, Move Out
  - Mobile-optimized: single column, large text
  - Confirmation dialog for move-out action

**RoomAssignment Component**
- Purpose: Select and assign a room to a tenant
- Props: `{tenantId: string, availableRooms: Room[], onAssign, onCancel}`
- Features:
  - List of available rooms only
  - Each room shows: number, type, monthly rent
  - Selection with confirmation
  - Mobile-optimized: full-width cards, 44x44px touch targets

**MoveOutConfirmation Component**
- Purpose: Confirm tenant move-out action
- Props: `{tenantName: string, roomNumber: string, onConfirm, onCancel}`
- Features:
  - Clear warning message
  - Confirm and Cancel buttons
  - Mobile-optimized: large buttons, clear spacing

## Data Models

### Database Schema

```sql
-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  moved_out_at TIMESTAMP NULL,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(50) NOT NULL UNIQUE,
  room_type VARCHAR(100) NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT status_values CHECK (status IN ('available', 'occupied', 'under_renovation'))
);

-- Indexes for performance
CREATE INDEX idx_tenants_room_id ON tenants(room_id);
CREATE INDEX idx_tenants_moved_out ON tenants(moved_out_at) WHERE moved_out_at IS NULL;
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_tenants_email ON tenants(email);
```

### Prisma Schema

```prisma
model Tenant {
  id         String    @id @default(uuid())
  name       String
  phone      String
  email      String
  roomId     String?   @map("room_id")
  room       Room?     @relation(fields: [roomId], references: [id])
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  movedOutAt DateTime? @map("moved_out_at")
  payments   Payment[]
  
  @@index([roomId])
  @@index([movedOutAt])
  @@index([email])
  @@map("tenants")
}

model Room {
  id          String   @id @default(uuid())
  roomNumber  String   @unique @map("room_number")
  roomType    String   @map("room_type")
  monthlyRent Decimal  @map("monthly_rent") @db.Decimal(10, 2)
  status      String   @default("available")
  createdAt   DateTime @default(now()) @map("created_at")
  tenants     Tenant[]
  
  @@index([status])
  @@map("rooms")
}
```

### Data Validation Rules

**Tenant Validation**:
- `name`: Required, 1-255 characters, non-empty after trim
- `phone`: Required, 1-50 characters, non-empty after trim
- `email`: Required, valid email format (RFC 5322 simplified)
- `roomId`: Optional, must reference existing room if provided
- `movedOutAt`: Optional, must be valid timestamp in UTC

**Room Validation**:
- `roomNumber`: Required, unique, 1-50 characters
- `roomType`: Required, 1-100 characters
- `monthlyRent`: Required, positive decimal with 2 decimal places
- `status`: Required, one of: 'available', 'occupied', 'under_renovation'

### Business Rules

**Room Assignment Rules**:
1. A tenant can be assigned to at most one room at a time
2. A room can have at most one active tenant (not moved out)
3. Only rooms with status 'available' can be assigned to tenants
4. When a tenant is assigned to a room, room status changes to 'occupied'
5. When a tenant moves out, room status changes to 'available'

**Move-Out Rules**:
1. Moving out a tenant sets `moved_out_at` to current timestamp (UTC)
2. Moving out a tenant sets their `room_id` to NULL
3. Moving out a tenant changes the room status to 'available'
4. Moved-out tenants are excluded from active tenant lists
5. Moved-out tenant records are preserved (soft delete)

### Data Integrity Constraints

**Database-Level Constraints**:
- Foreign key: `tenants.room_id` references `rooms.id`
- Unique constraint: `rooms.room_number`
- Check constraint: `rooms.monthly_rent > 0`
- Check constraint: `rooms.status` in allowed values
- Check constraint: `tenants.email` matches email pattern

**Application-Level Constraints**:
- Prevent assigning tenant to occupied room (check before update)
- Prevent assigning tenant who already has a room (check before update)
- Validate email format before database insertion
- Trim whitespace from all string fields before validation

### Migration Strategy

**Initial Migration**:
```sql
-- Create rooms table first (no dependencies)
CREATE TABLE rooms (...);

-- Create tenants table with foreign key to rooms
CREATE TABLE tenants (...);

-- Create indexes
CREATE INDEX ...;
```

**Rollback Strategy**:
```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tenant Creation Completeness

*For any* valid tenant data (name, phone, email), when a tenant is created, the system should return a tenant object with a unique identifier, creation timestamp, and all submitted data persisted to the database.

**Validates: Requirements 1.2, 1.4, 1.5**

### Property 2: Required Field Validation

*For any* tenant submission with one or more missing required fields (name, phone, or email), the system should reject the submission and return validation errors indicating which fields are missing.

**Validates: Requirements 1.3**

### Property 3: Available Rooms Filtering

*For any* set of rooms with various statuses, when requesting available rooms for assignment, the system should return only rooms with status 'available' and exclude all occupied or under-renovation rooms.

**Validates: Requirements 2.2**

### Property 4: Room Assignment State Changes

*For any* tenant and available room, when the tenant is assigned to the room, the system should link the tenant to the room, update the room status to 'occupied', and persist both changes to the database immediately.

**Validates: Requirements 2.3, 2.4**

### Property 5: Occupied Room Assignment Prevention

*For any* room with status 'occupied', when attempting to assign a new tenant to that room, the system should reject the assignment and return an error message.

**Validates: Requirements 2.5**

### Property 6: Tenant List Display Completeness

*For any* tenant in the tenant list view, the rendered list item should include the tenant's name and current room assignment (or indication of no assignment).

**Validates: Requirements 3.1**

### Property 7: Tenant Detail Display Completeness

*For any* tenant in the detail view, the rendered output should include name, phone number, email address, assigned room (if any), and creation date.

**Validates: Requirements 3.2**

### Property 8: Tenant Update Persistence

*For any* tenant and any valid field updates (name, phone, or email), when the updates are saved, the system should persist the new values to the database, update the modification timestamp, and return the updated tenant.

**Validates: Requirements 4.2, 4.4**

### Property 9: Tenant Update Invariant Preservation

*For any* tenant update operation, the system should preserve the tenant's unique identifier, creation timestamp, and room assignment unchanged.

**Validates: Requirements 4.3**

### Property 10: Invalid Data Validation

*For any* tenant update with invalid data (such as a malformed email address), the system should reject the update and return validation errors without modifying the database.

**Validates: Requirements 4.5**

### Property 11: Move-Out State Changes

*For any* tenant with a room assignment, when the tenant is moved out, the system should set the movedOutAt timestamp, remove the room assignment, change the room status to 'available', and preserve the tenant record in the database.

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 12: Tenant Creation Round Trip

*For any* valid tenant data, creating a tenant and then immediately retrieving it by ID should return a tenant object with all the originally submitted data intact.

**Validates: Requirements 1.2, 1.5**

## Error Handling

### Validation Errors

**Missing Required Fields**:
- Scenario: Tenant creation/update with empty name, phone, or email
- Handling: Return 400 Bad Request with field-specific error messages
- Response format: `{errors: {name: "Name is required", email: "Email is required"}}`
- UI: Display inline error messages below each invalid field

**Invalid Email Format**:
- Scenario: Email doesn't match RFC 5322 pattern
- Handling: Return 400 Bad Request with validation error
- Message: "Invalid email format"
- UI: Display error message below email field with example format

**Invalid UUID Format**:
- Scenario: Tenant ID or Room ID is not a valid UUID
- Handling: Return 400 Bad Request
- Message: "Invalid ID format"
- UI: Should not occur in normal usage (IDs are system-generated)

### Business Rule Violations

**Room Already Occupied**:
- Scenario: Attempting to assign tenant to occupied room
- Handling: Return 409 Conflict
- Message: "Room is already occupied by another tenant"
- UI: Display error message with option to view current occupant

**Tenant Already Has Room**:
- Scenario: Attempting to assign room to tenant who already has one
- Handling: Return 409 Conflict
- Message: "Tenant is already assigned to a room"
- UI: Display error message with option to view current assignment

**Room Not Found**:
- Scenario: Attempting to assign non-existent room
- Handling: Return 404 Not Found
- Message: "Room not found"
- UI: Should not occur if using room selection from available list

**Tenant Not Found**:
- Scenario: Attempting to update/view non-existent tenant
- Handling: Return 404 Not Found
- Message: "Tenant not found"
- UI: Display "Tenant not found" page with link to tenant list

### Database Errors

**Connection Failure**:
- Scenario: Database connection timeout or network error
- Handling: Return 503 Service Unavailable
- Retry: Implement exponential backoff (3 retries max)
- UI: Display "Service temporarily unavailable" with retry button

**Constraint Violation**:
- Scenario: Unique constraint violation (e.g., duplicate room number)
- Handling: Return 409 Conflict
- Message: Specific constraint violation message
- UI: Display error message with guidance

**Transaction Failure**:
- Scenario: Room assignment transaction fails mid-operation
- Handling: Rollback transaction, return 500 Internal Server Error
- Logging: Log full error details for debugging
- UI: Display generic error message with retry option

### Concurrency Issues

**Race Condition on Room Assignment**:
- Scenario: Two managers attempt to assign different tenants to same room simultaneously
- Handling: Use database transaction with row-level locking
- Result: First transaction succeeds, second receives 409 Conflict
- UI: Display "Room was just assigned to another tenant" with refresh option

**Stale Data on Update**:
- Scenario: Manager updates tenant based on outdated information
- Handling: Use optimistic locking with version field (future enhancement)
- Current: Last write wins (acceptable for MVP)
- UI: Display success message (no conflict detection in MVP)

### Network Errors

**Request Timeout**:
- Scenario: API request takes longer than 30 seconds
- Handling: Client-side timeout, cancel request
- UI: Display timeout message with retry button

**Network Disconnection**:
- Scenario: User loses internet connection during operation
- Handling: Display offline indicator
- UI: Queue operations for retry when connection restored (future enhancement)
- MVP: Display "No internet connection" message

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

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Example: Creating a tenant with valid data returns 201 status
- Example: Creating a tenant with missing email returns 400 status
- Edge case: Assigning tenant to occupied room returns 409 status
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
// Feature: tenant-room-basics, Property 1: Tenant Creation Completeness
test('tenant creation returns complete object with ID and timestamp', () => {
  fc.assert(
    fc.property(
      tenantDataArbitrary,
      async (tenantData) => {
        const result = await createTenant(tenantData);
        expect(result.id).toBeDefined();
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.name).toBe(tenantData.name);
        expect(result.phone).toBe(tenantData.phone);
        expect(result.email).toBe(tenantData.email);
        
        // Verify persistence
        const retrieved = await getTenant(result.id);
        expect(retrieved).toEqual(result);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Data Generators

**Tenant Data Generator**:
```typescript
const tenantDataArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  phone: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  email: fc.emailAddress()
});
```

**Tenant Generator** (with ID):
```typescript
const tenantArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  phone: fc.string({ minLength: 1, maxLength: 20 }),
  email: fc.emailAddress(),
  roomId: fc.option(fc.uuid(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  movedOutAt: fc.option(fc.date(), { nil: null })
});
```

**Room Generator**:
```typescript
const roomArbitrary = fc.record({
  id: fc.uuid(),
  roomNumber: fc.string({ minLength: 1, maxLength: 20 }),
  roomType: fc.constantFrom('single', 'double', 'suite', 'studio'),
  monthlyRent: fc.float({ min: 100, max: 10000, noNaN: true }),
  status: fc.constantFrom('available', 'occupied', 'under_renovation'),
  createdAt: fc.date()
});
```

**Invalid Email Generator**:
```typescript
const invalidEmailArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant('notanemail'),
  fc.constant('@example.com'),
  fc.constant('user@'),
  fc.constant('user @example.com'),
  fc.string().filter(s => !s.includes('@'))
);
```

### Test Coverage Requirements

**Unit Tests** (40-60 tests):
- Tenant creation: valid data, missing fields, invalid email (5-8 tests)
- Tenant retrieval: by ID, list all, filter by room (3-5 tests)
- Tenant update: valid updates, invalid data, preserve invariants (5-8 tests)
- Room assignment: success, room occupied, tenant has room (5-8 tests)
- Move-out: success, room freed, soft delete (3-5 tests)
- API routes: request/response format, status codes (10-15 tests)
- UI components: rendering, user interactions (10-15 tests)

**Property-Based Tests** (12 tests):
- One test per correctness property
- Each test runs 100+ iterations
- Covers full input space through randomization

**Integration Tests** (5-10 tests):
- End-to-end tenant creation flow
- End-to-end room assignment flow
- End-to-end move-out flow
- Database transaction rollback on error
- Concurrent room assignment handling

### Mobile Testing

**Responsive Design Testing**:
- Test layouts at 320px, 375px, 414px, 480px widths
- Verify single-column layout at all breakpoints
- Verify no horizontal scrolling required
- Use browser DevTools device emulation

**Touch Target Testing**:
- Measure rendered button and link dimensions
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
- Verify tenant creation completes in <2 seconds
- Verify tenant list loads in <2 seconds with 1,000 records
- Verify room assignment completes in <2 seconds

**Load Testing**:
- Test with 1,000 tenant records
- Test with 500 room records
- Verify list rendering performance
- Verify search/filter performance

**Database Performance**:
- Measure query execution times
- Verify indexed queries complete in <100ms
- Test transaction performance for room assignment
- Monitor connection pool usage

### Internationalization Testing

**Translation Coverage**:
- Verify all UI text uses translation keys
- Test language switching (English ↔ Indonesian)
- Verify no hardcoded strings in components
- Test with missing translation keys (fallback behavior)

**Locale Formatting**:
- Test date formatting in different locales
- Test number formatting (decimal separators)
- Verify currency formatting (if applicable)

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
        // Default mobile-first approach
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
// TenantListItem component
<div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm w-full">
  <h3 className="text-lg font-semibold">{tenant.name}</h3>
  <p className="text-sm text-gray-600">
    {tenant.roomId ? `Room ${room.roomNumber}` : 'No room assigned'}
  </p>
  <button className="min-h-[44px] min-w-[44px] px-4 py-2 bg-blue-600 text-white rounded">
    View Details
  </button>
</div>
```

### Form Validation Implementation

**Zod Schema** (shared between frontend and backend):
```typescript
import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  phone: z.string().min(1, 'Phone is required').max(50).trim(),
  email: z.string().email('Invalid email format').max(255).trim()
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  phone: z.string().min(1).max(50).trim().optional(),
  email: z.string().email('Invalid email format').max(255).trim().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const assignRoomSchema = z.object({
  roomId: z.string().uuid('Invalid room ID')
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type AssignRoomInput = z.infer<typeof assignRoomSchema>;
```

**React Hook Form Integration**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function TenantForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createTenantSchema)
  });
  
  const onSubmit = async (data: CreateTenantInput) => {
    await createTenant(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... other fields */}
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
  "tenant": {
    "create": {
      "title": "Add Tenant",
      "name": "Full Name",
      "phone": "Phone Number",
      "email": "Email Address",
      "submit": "Create Tenant",
      "cancel": "Cancel",
      "success": "Tenant created successfully"
    },
    "edit": {
      "title": "Edit Tenant",
      "submit": "Save Changes",
      "success": "Tenant updated successfully"
    },
    "list": {
      "title": "Tenants",
      "empty": "No tenants found",
      "noRoom": "No room assigned"
    },
    "detail": {
      "title": "Tenant Details",
      "assignRoom": "Assign Room",
      "moveOut": "Move Out",
      "edit": "Edit"
    },
    "moveOut": {
      "confirm": "Are you sure you want to move out {{name}}?",
      "warning": "This will free up {{room}} for new assignments.",
      "submit": "Confirm Move Out",
      "cancel": "Cancel",
      "success": "Tenant moved out successfully"
    },
    "validation": {
      "nameRequired": "Name is required",
      "phoneRequired": "Phone number is required",
      "emailRequired": "Email address is required",
      "emailInvalid": "Invalid email format"
    },
    "errors": {
      "roomOccupied": "Room is already occupied",
      "tenantHasRoom": "Tenant already has a room",
      "notFound": "Tenant not found",
      "loadFailed": "Failed to load tenant data"
    }
  },
  "room": {
    "assign": {
      "title": "Assign Room",
      "select": "Select a room",
      "available": "Available Rooms",
      "empty": "No available rooms",
      "submit": "Assign Room",
      "cancel": "Cancel",
      "success": "Room assigned successfully"
    }
  }
}
```

**Indonesian Translation File** (`locales/id.json`):
```json
{
  "tenant": {
    "create": {
      "title": "Tambah Penyewa",
      "name": "Nama Lengkap",
      "phone": "Nomor Telepon",
      "email": "Alamat Email",
      "submit": "Buat Penyewa",
      "cancel": "Batal",
      "success": "Penyewa berhasil dibuat"
    },
    "edit": {
      "title": "Edit Penyewa",
      "submit": "Simpan Perubahan",
      "success": "Penyewa berhasil diperbarui"
    },
    "list": {
      "title": "Penyewa",
      "empty": "Tidak ada penyewa",
      "noRoom": "Belum ada kamar"
    },
    "detail": {
      "title": "Detail Penyewa",
      "assignRoom": "Tetapkan Kamar",
      "moveOut": "Pindah Keluar",
      "edit": "Edit"
    },
    "moveOut": {
      "confirm": "Apakah Anda yakin ingin memindahkan {{name}}?",
      "warning": "Ini akan membebaskan {{room}} untuk penugasan baru.",
      "submit": "Konfirmasi Pindah Keluar",
      "cancel": "Batal",
      "success": "Penyewa berhasil dipindahkan"
    },
    "validation": {
      "nameRequired": "Nama wajib diisi",
      "phoneRequired": "Nomor telepon wajib diisi",
      "emailRequired": "Alamat email wajib diisi",
      "emailInvalid": "Format email tidak valid"
    },
    "errors": {
      "roomOccupied": "Kamar sudah ditempati",
      "tenantHasRoom": "Penyewa sudah memiliki kamar",
      "notFound": "Penyewa tidak ditemukan",
      "loadFailed": "Gagal memuat data penyewa"
    }
  },
  "room": {
    "assign": {
      "title": "Tetapkan Kamar",
      "select": "Pilih kamar",
      "available": "Kamar Tersedia",
      "empty": "Tidak ada kamar tersedia",
      "submit": "Tetapkan Kamar",
      "cancel": "Batal",
      "success": "Kamar berhasil ditetapkan"
    }
  }
}
```

**i18next Configuration**:
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import id from './locales/id.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      id: { translation: id }
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes
    }
  });

export default i18n;
```

**Usage in Components**:
```typescript
import { useTranslation } from 'react-i18next';

function TenantForm() {
  const { t } = useTranslation();
  
  return (
    <form>
      <h2>{t('tenant.create.title')}</h2>
      <label>{t('tenant.create.name')}</label>
      <input type="text" />
      <button>{t('tenant.create.submit')}</button>
    </form>
  );
}
```

### API Route Implementation

**POST /api/tenants**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createTenantSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTenantSchema.parse(body);
    
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email
      }
    });
    
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**POST /api/tenants/:id/assign-room**:
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { roomId } = assignRoomSchema.parse(body);
    
    // Check if room is available
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }
    
    if (room.status !== 'available') {
      return NextResponse.json(
        { error: 'Room is already occupied' },
        { status: 409 }
      );
    }
    
    // Check if tenant already has a room
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    if (tenant.roomId) {
      return NextResponse.json(
        { error: 'Tenant already has a room' },
        { status: 409 }
      );
    }
    
    // Perform assignment in transaction
    const result = await prisma.$transaction([
      prisma.tenant.update({
        where: { id: params.id },
        data: { roomId }
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { status: 'occupied' }
      })
    ]);
    
    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    // Error handling...
  }
}
```

### Database Transaction Handling

**Room Assignment Transaction**:
```typescript
async function assignTenantToRoom(tenantId: string, roomId: string) {
  return await prisma.$transaction(async (tx) => {
    // Lock the room row to prevent race conditions
    const room = await tx.room.findUnique({
      where: { id: roomId }
    });
    
    if (room.status !== 'available') {
      throw new Error('Room is not available');
    }
    
    // Update tenant
    const tenant = await tx.tenant.update({
      where: { id: tenantId },
      data: { roomId }
    });
    
    // Update room status
    await tx.room.update({
      where: { id: roomId },
      data: { status: 'occupied' }
    });
    
    return tenant;
  });
}
```

### Performance Optimization

**Query Optimization**:
```typescript
// Include room data in tenant queries to avoid N+1 problem
const tenants = await prisma.tenant.findMany({
  where: { movedOutAt: null },
  include: {
    room: {
      select: {
        id: true,
        roomNumber: true,
        roomType: true
      }
    }
  }
});
```

**Pagination for Large Lists**:
```typescript
const PAGE_SIZE = 50;

async function listTenants(page: number = 1) {
  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where: { movedOutAt: null },
      include: { room: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tenant.count({
      where: { movedOutAt: null }
    })
  ]);
  
  return {
    tenants,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE)
  };
}
```

**Client-Side Caching with React Query**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
    staleTime: 30000 // 30 seconds
  });
}

function useCreateTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      // Invalidate and refetch tenant list
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
}
```

### Security Considerations

**Input Sanitization**:
- All string inputs are trimmed before validation
- Email validation prevents injection attacks
- UUID validation prevents SQL injection
- Zod schema validation on both client and server

**SQL Injection Prevention**:
- Prisma uses parameterized queries automatically
- No raw SQL queries in MVP
- All user inputs validated before database operations

**Authorization**:
- Supabase Auth enforces authenticated access to all tenant endpoints
- Implement row-level security in Supabase to scope data to authenticated user
- Verify user has permission to access/modify tenants
- Audit log for all CRUD operations

### Deployment Considerations

**Database Migration**:
```bash
# Generate migration
npx prisma migrate dev --name init_tenant_room_tables

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
- Database connection pooling via Prisma Data Proxy or Supabase

**Monitoring**:
- Track API response times
- Monitor database query performance
- Alert on error rates exceeding threshold
- Log all validation errors for analysis

## Future Enhancements

**Out of Scope for MVP**:
- Bulk tenant import from CSV/Excel
- Tenant photo upload and storage
- Emergency contact information
- Lease document attachment
- Tenant communication/messaging
- Automated lease renewal reminders
- Tenant screening and background checks
- Multi-property management
- Role-based access control
- Audit log for all changes
- Advanced search and filtering
- Export tenant list to CSV/PDF
- Tenant portal for self-service updates

**Post-MVP Considerations**:
- Real-time updates using Supabase Realtime
- Offline support with local storage sync
- Advanced validation (phone number format by country)
- Duplicate tenant detection
- Tenant merge functionality
- Historical room assignment tracking
- Integration with payment gateways
- Automated rent calculation based on room type
- Custom fields for tenant attributes
- Tags and categories for tenant organization
