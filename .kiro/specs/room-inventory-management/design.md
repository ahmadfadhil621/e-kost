# Design: Room Inventory Management

## Overview

The Room Inventory Management feature provides comprehensive CRUD operations for managing room inventory in E-Kost. This feature enables property managers to create rooms, update room details, manage room status (available, occupied, under renovation), and filter rooms by status—all through a mobile-optimized interface with card-based layouts.

### Key Design Decisions

**Mobile-First Card Layout**: All room displays use a card-based layout optimized for 320px-480px screen widths. Cards are full-width with adequate padding, clear visual separation, and 44x44px minimum touch targets for all interactive elements.

**Status-Driven Workflow**: Room status (available, occupied, under renovation) is the primary organizing principle. Visual indicators use color, icons, and text labels to ensure clarity at phone scale without relying on color alone.

**Immediate Persistence**: All CRUD operations persist to the database immediately upon user action, with confirmation feedback within 2 seconds. No local-only state or delayed synchronization.

**Language-Agnostic Design**: All user-facing text uses translation keys stored in JSON files (`locales/en.json`, `locales/id.json`). Changing language requires only updating the active locale, not code changes.

**Unique Room Identifiers**: Room numbers/identifiers must be unique within the property. The system enforces this constraint at both the database and application levels to prevent duplicate room assignments.

**Immutable Room IDs**: Once created, a room's unique identifier (UUID) cannot be modified. This ensures referential integrity with tenant assignments and payment records.

## Architecture

### System Context

The Room Inventory Management feature provides the foundational room data that tenant assignment and payment recording depend on. It manages room lifecycle from creation through status updates.

```mermaid
graph TB
    A[Mobile UI] --> B[Room Management]
    B --> C[API Routes]
    C --> D[Database Layer]
    D --> E[(PostgreSQL)]
    
    F[Tenant Assignment] -.depends on.-> B
    G[Outstanding Balance] -.depends on.-> B
```

### Component Architecture

```mermaid
graph LR
    A[UI Components] --> B[API Routes]
    B --> C[Service Layer]
    C --> D[Data Access Layer]
    D --> E[(Database)]
    
    A1[RoomForm] --> A
    A2[RoomList] --> A
    A3[RoomCard] --> A
    A4[RoomDetail] --> A
    A5[StatusFilter] --> A
    
    B1[/api/rooms] --> B
    B2[/api/rooms/:id] --> B
    B3[/api/rooms/:id/status] --> B
    
    C1[RoomService] --> C
    C2[ValidationService] --> C
```

### Data Flow: Room Creation

```mermaid
sequenceDiagram
    participant UI as Mobile UI
    participant API as API Route
    participant Val as Validation
    participant DB as Database
    
    UI->>API: POST /api/rooms {roomNumber, roomType, monthlyRent}
    API->>Val: Validate required fields & uniqueness
    Val-->>API: Valid
    API->>DB: INSERT room record
    DB-->>API: Room created (id, timestamp)
    API-->>UI: 201 Created {room}
    UI->>UI: Display confirmation
```

### Data Flow: Status Update

```mermaid
sequenceDiagram
    participant UI as Mobile UI
    participant API as API Route
    participant DB as Database
    
    UI->>API: PATCH /api/rooms/:id/status {status}
    API->>DB: SELECT room WHERE id=:id
    DB-->>API: Room found
    API->>DB: UPDATE rooms SET status=:status, updated_at=NOW()
    DB-->>API: Update successful
    API-->>UI: 200 OK {room}
    UI->>UI: Update card display
```

### Data Flow: Room Filtering

```mermaid
sequenceDiagram
    participant UI as Mobile UI
    participant API as API Route
    participant DB as Database
    
    UI->>API: GET /api/rooms?status=available
    API->>DB: SELECT rooms WHERE status='available'
    DB-->>API: Filtered rooms list
    API-->>UI: 200 OK {rooms, count}
    UI->>UI: Display filtered cards
```

## Components and Interfaces

### 1. Room Service

**Responsibility**: Business logic for room CRUD operations, validation, and status management.

**Interface**:
```typescript
interface RoomService {
  // Create a new room
  createRoom(data: CreateRoomInput): Promise<Room>;
  
  // Retrieve room by ID
  getRoom(id: string): Promise<Room | null>;
  
  // Retrieve all rooms with optional filtering
  listRooms(filters?: RoomFilters): Promise<Room[]>;
  
  // Update room information
  updateRoom(id: string, data: UpdateRoomInput): Promise<Room>;
  
  // Update room status
  updateRoomStatus(id: string, status: RoomStatus): Promise<Room>;
}

interface CreateRoomInput {
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
}

interface UpdateRoomInput {
  roomNumber?: string;
  roomType?: string;
  monthlyRent?: number;
}

interface RoomFilters {
  status?: RoomStatus;
}

type RoomStatus = 'available' | 'occupied' | 'under_renovation';

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. API Routes

**POST /api/rooms**
- Creates a new room record
- Request body: `{roomNumber, roomType, monthlyRent}`
- Response: 201 Created with room object
- Validation: All fields required, roomNumber unique, monthlyRent positive

**GET /api/rooms**
- Lists all rooms with optional status filtering
- Query params: `?status=available|occupied|under_renovation`
- Response: 200 OK with array of rooms and count
- Default: Returns all rooms if no filter specified

**GET /api/rooms/:id**
- Retrieves a single room by ID
- Response: 200 OK with room object, or 404 Not Found
- Includes all room attributes

**PUT /api/rooms/:id**
- Updates room information
- Request body: `{roomNumber?, roomType?, monthlyRent?}`
- Response: 200 OK with updated room
- Validation: roomNumber unique if provided, monthlyRent positive if provided
- Preserves: id, status, createdAt

**PATCH /api/rooms/:id/status**
- Updates room status only
- Request body: `{status}`
- Response: 200 OK with updated room
- Validation: status must be one of three allowed values

### 3. UI Components

**RoomForm Component**
- Purpose: Create or edit room information
- Props: `{mode: 'create' | 'edit', initialData?: Room, onSubmit, onCancel}`
- Features:
  - Form fields: roomNumber (text), roomType (text), monthlyRent (number)
  - Client-side validation with error messages
  - Submit button disabled until valid
  - Mobile-optimized: vertical stack, 44x44px touch targets
  - Translation keys for all labels and messages

**RoomList Component**
- Purpose: Display all rooms in scrollable card layout
- Props: `{rooms: Room[], onSelectRoom, onFilterChange}`
- Features:
  - Single-column card layout
  - Each card shows: room number, type, rent, status indicator
  - Status filter buttons at top
  - Touch-optimized: full-width cards, adequate padding
  - Empty state message when no rooms match filter
  - Loading state during data fetch

**RoomCard Component**
- Purpose: Display individual room in list view
- Props: `{room: Room, onSelect}`
- Features:
  - Full-width card with clear visual separation
  - Status indicator: color + icon + text label
  - Room number prominently displayed
  - Room type and monthly rent clearly visible
  - Touch target: entire card is tappable (44x44px minimum height)
  - Mobile-optimized typography and spacing

**RoomDetail Component**
- Purpose: Display full room information with actions
- Props: `{room: Room, onEdit, onUpdateStatus}`
- Features:
  - Displays: room number, type, rent, status, creation date
  - Action buttons: Edit, Change Status
  - Status change dropdown with three options
  - Mobile-optimized: single column, large text
  - Confirmation message after status update

**StatusFilter Component**
- Purpose: Filter rooms by status
- Props: `{currentFilter: RoomStatus | 'all', onFilterChange}`
- Features:
  - Four buttons: All, Available, Occupied, Under Renovation
  - Active filter visually highlighted
  - Touch-optimized: 44x44px minimum button size
  - Shows count of rooms matching each filter
  - Mobile-optimized: horizontal scroll if needed

**StatusIndicator Component**
- Purpose: Display room status with visual clarity
- Props: `{status: RoomStatus, size: 'small' | 'large'}`
- Features:
  - Color coding: green (available), red (occupied), yellow (under renovation)
  - Icon: checkmark (available), user (occupied), wrench (under renovation)
  - Text label: always displayed alongside color/icon
  - Accessible: doesn't rely on color alone
  - Mobile-optimized: clearly visible at phone scale

## Data Models

### Database Schema

```sql
-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(50) NOT NULL UNIQUE,
  room_type VARCHAR(100) NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT status_values CHECK (status IN ('available', 'occupied', 'under_renovation'))
);

-- Indexes for performance
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE UNIQUE INDEX idx_rooms_room_number ON rooms(room_number);
```

### Prisma Schema

```prisma
model Room {
  id          String    @id @default(uuid())
  roomNumber  String    @unique @map("room_number")
  roomType    String    @map("room_type")
  monthlyRent Decimal   @map("monthly_rent") @db.Decimal(10, 2)
  status      String    @default("available")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  tenants     Tenant[]
  
  @@index([status])
  @@map("rooms")
}
```

### Data Validation Rules

**Room Validation**:
- `roomNumber`: Required, 1-50 characters, unique within property, non-empty after trim
- `roomType`: Required, 1-100 characters, non-empty after trim
- `monthlyRent`: Required, positive decimal with 2 decimal places, greater than 0
- `status`: Required, one of: 'available', 'occupied', 'under_renovation'

### Business Rules

**Room Creation Rules**:
1. Room number must be unique within the property
2. Monthly rent must be a positive number
3. Initial status is always 'available'
4. Creation timestamp is recorded in UTC
5. Unique identifier (UUID) is auto-generated and immutable

**Room Update Rules**:
1. Room number can be changed but must remain unique
2. Monthly rent can be updated but must remain positive
3. Room type can be changed freely
4. Unique identifier, creation timestamp, and status are preserved during updates
5. Update timestamp is automatically updated

**Status Update Rules**:
1. Status can be changed to any of the three allowed values
2. Status changes are independent of room information updates
3. Status change timestamp is recorded
4. Status changes do not affect other room attributes

### Data Integrity Constraints

**Database-Level Constraints**:
- Unique constraint: `rooms.room_number`
- Check constraint: `rooms.monthly_rent > 0`
- Check constraint: `rooms.status` in allowed values
- NOT NULL constraints on all required fields

**Application-Level Constraints**:
- Validate room number uniqueness before insertion
- Validate monthly rent is positive before database operation
- Validate status is one of three allowed values
- Trim whitespace from string fields before validation

### Migration Strategy

**Initial Migration**:
```sql
-- Create rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(50) NOT NULL UNIQUE,
  room_type VARCHAR(100) NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT status_values CHECK (status IN ('available', 'occupied', 'under_renovation'))
);

-- Create indexes
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE UNIQUE INDEX idx_rooms_room_number ON rooms(room_number);
```

**Rollback Strategy**:
```sql
-- Drop table
DROP TABLE IF EXISTS rooms CASCADE;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Room Creation Completeness

*For any* valid room data (roomNumber, roomType, monthlyRent), when a room is created, the system should return a room object with a unique identifier, initial status set to 'available', creation timestamp, and all submitted data persisted to the database immediately.

**Validates: Requirements 1.2, 1.4, 1.5**

### Property 2: Required Field Validation

*For any* room submission with one or more missing required fields (roomNumber, roomType, or monthlyRent), the system should reject the submission and return validation errors indicating which fields are missing.

**Validates: Requirements 1.3**

### Property 3: Status Value Constraint

*For any* status update attempt, the system should accept only the three allowed values ('available', 'occupied', 'under_renovation') and reject any other value with a validation error.

**Validates: Requirements 2.2**

### Property 4: Status Update Persistence

*For any* room and any valid status value, when the room status is updated, the system should persist the new status, record the update timestamp, and return the updated room object.

**Validates: Requirements 2.3, 2.4, 2.5**


### Property 5: Status Update Confirmation

*For any* room status update, the system should return a confirmation response indicating the new status value.

**Validates: Requirements 2.6**

### Property 6: Room Card Display Completeness

*For any* room in the room list view, the rendered card should include the room number, room type, monthly rent amount, and current status.

**Validates: Requirements 3.2**

### Property 7: Status Indicator Presence

*For any* room card rendering, the output should include visual indicators (at minimum, text labels) that distinguish between the three status values.

**Validates: Requirements 3.4**

### Property 8: Room Update Persistence

*For any* room and any valid field updates (roomNumber, roomType, or monthlyRent), when the updates are saved, the system should persist the new values to the database, update the modification timestamp, and return the updated room.

**Validates: Requirements 4.2, 4.4**

### Property 9: Room Update Invariant Preservation

*For any* room update operation, the system should preserve the room's unique identifier, creation timestamp, and status unchanged.

**Validates: Requirements 4.3**


### Property 10: Invalid Data Validation

*For any* room update with invalid data (such as negative rent amount, empty required fields, or duplicate room number), the system should reject the update and return validation errors without modifying the database.

**Validates: Requirements 4.5**

### Property 11: Status Filtering Correctness

*For any* collection of rooms with various statuses, when a status filter is applied, the system should return only rooms matching that status and exclude all others.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 12: Filter Result Count Accuracy

*For any* applied filter, the system should return a count that exactly matches the number of rooms in the filtered result set.

**Validates: Requirements 5.5**

### Property 13: Room Creation Round Trip

*For any* valid room data, creating a room and then immediately retrieving it by ID should return a room object with all the originally submitted data intact.

**Validates: Requirements 1.2, 1.5**

### Property 14: Room Number Uniqueness Enforcement

*For any* attempt to create or update a room with a room number that already exists in the system, the system should reject the operation and return a uniqueness constraint error.

**Validates: Constraints (room numbers must be unique within property)**



## Error Handling

### Validation Errors

**Missing Required Fields**:
- Scenario: Room creation/update with empty roomNumber, roomType, or monthlyRent
- Handling: Return 400 Bad Request with field-specific error messages
- Response format: `{errors: {roomNumber: "Room number is required", monthlyRent: "Monthly rent is required"}}`
- UI: Display inline error messages below each invalid field

**Invalid Monthly Rent**:
- Scenario: Monthly rent is zero, negative, or not a number
- Handling: Return 400 Bad Request with validation error
- Message: "Monthly rent must be a positive number"
- UI: Display error message below monthly rent field

**Invalid Status Value**:
- Scenario: Status update with value other than 'available', 'occupied', or 'under_renovation'
- Handling: Return 400 Bad Request with validation error
- Message: "Status must be one of: available, occupied, under_renovation"
- UI: Should not occur if using dropdown selection (defensive validation)

**Invalid UUID Format**:
- Scenario: Room ID is not a valid UUID
- Handling: Return 400 Bad Request
- Message: "Invalid room ID format"
- UI: Should not occur in normal usage (IDs are system-generated)


### Business Rule Violations

**Duplicate Room Number**:
- Scenario: Attempting to create or update room with existing room number
- Handling: Return 409 Conflict
- Message: "Room number already exists"
- UI: Display error message with suggestion to use different room number

**Room Not Found**:
- Scenario: Attempting to update/view non-existent room
- Handling: Return 404 Not Found
- Message: "Room not found"
- UI: Display "Room not found" page with link to room list

### Database Errors

**Connection Failure**:
- Scenario: Database connection timeout or network error
- Handling: Return 503 Service Unavailable
- Retry: Implement exponential backoff (3 retries max)
- UI: Display "Service temporarily unavailable" with retry button

**Constraint Violation**:
- Scenario: Unique constraint violation on room_number
- Handling: Return 409 Conflict
- Message: "Room number already exists"
- UI: Display error message with guidance

**Transaction Failure**:
- Scenario: Database operation fails mid-transaction
- Handling: Rollback transaction, return 500 Internal Server Error
- Logging: Log full error details for debugging
- UI: Display generic error message with retry option


### Concurrency Issues

**Race Condition on Room Number**:
- Scenario: Two managers attempt to create rooms with same room number simultaneously
- Handling: Use database unique constraint to prevent duplicates
- Result: First transaction succeeds, second receives 409 Conflict
- UI: Display "Room number already exists" with refresh option

**Stale Data on Update**:
- Scenario: Manager updates room based on outdated information
- Handling: Use optimistic locking with updatedAt field (future enhancement)
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
- Example: Creating a room with valid data returns 201 status
- Example: Creating a room with missing roomNumber returns 400 status
- Edge case: Creating room with negative rent returns 400 status
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
// Feature: room-inventory-management, Property 1: Room Creation Completeness
test('room creation returns complete object with ID, status, and timestamp', () => {
  fc.assert(
    fc.property(
      roomDataArbitrary,
      async (roomData) => {
        const result = await createRoom(roomData);
        expect(result.id).toBeDefined();
        expect(result.status).toBe('available');
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.roomNumber).toBe(roomData.roomNumber);
        expect(result.roomType).toBe(roomData.roomType);
        expect(result.monthlyRent).toBe(roomData.monthlyRent);
        
        // Verify persistence
        const retrieved = await getRoom(result.id);
        expect(retrieved).toEqual(result);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Data Generators

**Room Data Generator**:
```typescript
const roomDataArbitrary = fc.record({
  roomNumber: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  roomType: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  monthlyRent: fc.float({ min: 0.01, max: 100000, noNaN: true })
});
```


**Room Generator** (with ID):
```typescript
const roomArbitrary = fc.record({
  id: fc.uuid(),
  roomNumber: fc.string({ minLength: 1, maxLength: 50 }),
  roomType: fc.string({ minLength: 1, maxLength: 100 }),
  monthlyRent: fc.float({ min: 0.01, max: 100000, noNaN: true }),
  status: fc.constantFrom('available', 'occupied', 'under_renovation'),
  createdAt: fc.date(),
  updatedAt: fc.date()
});
```

**Invalid Room Data Generator**:
```typescript
const invalidRoomDataArbitrary = fc.oneof(
  // Missing roomNumber
  fc.record({
    roomType: fc.string({ minLength: 1 }),
    monthlyRent: fc.float({ min: 0.01, max: 100000 })
  }),
  // Missing roomType
  fc.record({
    roomNumber: fc.string({ minLength: 1 }),
    monthlyRent: fc.float({ min: 0.01, max: 100000 })
  }),
  // Missing monthlyRent
  fc.record({
    roomNumber: fc.string({ minLength: 1 }),
    roomType: fc.string({ minLength: 1 })
  }),
  // Negative rent
  fc.record({
    roomNumber: fc.string({ minLength: 1 }),
    roomType: fc.string({ minLength: 1 }),
    monthlyRent: fc.float({ max: -0.01 })
  }),
  // Zero rent
  fc.record({
    roomNumber: fc.string({ minLength: 1 }),
    roomType: fc.string({ minLength: 1 }),
    monthlyRent: fc.constant(0)
  })
);
```


**Status Value Generator**:
```typescript
const statusArbitrary = fc.constantFrom('available', 'occupied', 'under_renovation');

const invalidStatusArbitrary = fc.string().filter(
  s => !['available', 'occupied', 'under_renovation'].includes(s)
);
```

### Test Coverage Requirements

**Unit Tests** (35-50 tests):
- Room creation: valid data, missing fields, invalid rent (5-8 tests)
- Room retrieval: by ID, list all, filter by status (3-5 tests)
- Room update: valid updates, invalid data, preserve invariants (5-8 tests)
- Status update: valid status changes, invalid status values (3-5 tests)
- API routes: request/response format, status codes (10-15 tests)
- UI components: rendering, user interactions (10-15 tests)

**Property-Based Tests** (14 tests):
- One test per correctness property
- Each test runs 100+ iterations
- Covers full input space through randomization

**Integration Tests** (5-8 tests):
- End-to-end room creation flow
- End-to-end status update flow
- End-to-end room filtering flow
- Database constraint enforcement
- Concurrent room creation with duplicate numbers


### Mobile Testing

**Responsive Design Testing**:
- Test layouts at 320px, 375px, 414px, 480px widths
- Verify single-column layout at all breakpoints
- Verify no horizontal scrolling required
- Use browser DevTools device emulation

**Touch Target Testing**:
- Measure rendered button and card dimensions
- Verify all interactive elements are 44x44px minimum
- Test with touch event simulation

**Card Layout Testing**:
- Verify cards are full-width on mobile
- Verify adequate padding and visual separation
- Test scrolling behavior with many rooms

**Accessibility Testing**:
- Test with screen readers (VoiceOver, TalkBack)
- Verify all form fields have associated labels
- Verify color contrast meets WCAG AA standards
- Verify status indicators don't rely on color alone
- Test keyboard navigation

### Performance Testing

**Response Time Testing**:
- Measure API response times for all endpoints
- Verify room creation completes in <2 seconds
- Verify room list loads in <2 seconds with 500 records
- Verify status update completes in <2 seconds

**Load Testing**:
- Test with 500 room records (constraint requirement)
- Verify list rendering performance
- Verify filter performance with large datasets
- Monitor memory usage during scrolling


**Database Performance**:
- Measure query execution times
- Verify indexed queries complete in <100ms
- Test unique constraint enforcement performance
- Monitor connection pool usage

### Internationalization Testing

**Translation Coverage**:
- Verify all UI text uses translation keys
- Test language switching (English ↔ Indonesian)
- Verify no hardcoded strings in components
- Test with missing translation keys (fallback behavior)

**Locale Formatting**:
- Test number formatting for monthly rent (decimal separators)
- Verify currency formatting if applicable
- Test date formatting in different locales



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
// RoomCard component
<div className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-sm w-full min-h-[44px]">
  <div className="flex justify-between items-start">
    <h3 className="text-lg font-semibold">{room.roomNumber}</h3>
    <StatusIndicator status={room.status} />
  </div>
  <p className="text-sm text-gray-600">{room.roomType}</p>
  <p className="text-base font-medium">
    {formatCurrency(room.monthlyRent)}/month
  </p>
</div>
```


**Status Indicator Styling**:
```tsx
// StatusIndicator component
function StatusIndicator({ status }: { status: RoomStatus }) {
  const config = {
    available: {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Available'
    },
    occupied: {
      color: 'bg-red-100 text-red-800',
      icon: <User className="w-4 h-4" />,
      label: 'Occupied'
    },
    under_renovation: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Wrench className="w-4 h-4" />,
      label: 'Under Renovation'
    }
  };
  
  const { color, icon, label } = config[status];
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${color}`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
```


### Form Validation Implementation

**Zod Schema** (shared between frontend and backend):
```typescript
import { z } from 'zod';

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').max(50).trim(),
  roomType: z.string().min(1, 'Room type is required').max(100).trim(),
  monthlyRent: z.number().positive('Monthly rent must be positive')
});

export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1).max(50).trim().optional(),
  roomType: z.string().min(1).max(100).trim().optional(),
  monthlyRent: z.number().positive('Monthly rent must be positive').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const updateRoomStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'under_renovation'])
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>;
```


**React Hook Form Integration**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function RoomForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createRoomSchema)
  });
  
  const onSubmit = async (data: CreateRoomInput) => {
    await createRoom(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('room.create.roomNumber')}
        </label>
        <input 
          {...register('roomNumber')} 
          className="w-full min-h-[44px] px-3 py-2 border rounded"
        />
        {errors.roomNumber && (
          <span className="text-red-600 text-sm">{errors.roomNumber.message}</span>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('room.create.roomType')}
        </label>
        <input 
          {...register('roomType')} 
          className="w-full min-h-[44px] px-3 py-2 border rounded"
        />
        {errors.roomType && (
          <span className="text-red-600 text-sm">{errors.roomType.message}</span>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('room.create.monthlyRent')}
        </label>
        <input 
          {...register('monthlyRent', { valueAsNumber: true })} 
          type="number"
          step="0.01"
          className="w-full min-h-[44px] px-3 py-2 border rounded"
        />
        {errors.monthlyRent && (
          <span className="text-red-600 text-sm">{errors.monthlyRent.message}</span>
        )}
      </div>
      
      <button 
        type="submit" 
        className="min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded"
      >
        {t('room.create.submit')}
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
  "room": {
    "create": {
      "title": "Add Room",
      "roomNumber": "Room Number",
      "roomType": "Room Type",
      "monthlyRent": "Monthly Rent",
      "submit": "Create Room",
      "cancel": "Cancel",
      "success": "Room created successfully"
    },
    "edit": {
      "title": "Edit Room",
      "submit": "Save Changes",
      "success": "Room updated successfully"
    },
    "list": {
      "title": "Rooms",
      "empty": "No rooms found",
      "filterAll": "All Rooms",
      "filterAvailable": "Available",
      "filterOccupied": "Occupied",
      "filterRenovation": "Under Renovation"
    },
    "detail": {
      "title": "Room Details",
      "edit": "Edit",
      "changeStatus": "Change Status"
    },
    "status": {
      "available": "Available",
      "occupied": "Occupied",
      "under_renovation": "Under Renovation",
      "updateSuccess": "Room status updated successfully"
    },
    "validation": {
      "roomNumberRequired": "Room number is required",
      "roomTypeRequired": "Room type is required",
      "monthlyRentRequired": "Monthly rent is required",
      "monthlyRentPositive": "Monthly rent must be positive"
    },
    "errors": {
      "duplicateRoomNumber": "Room number already exists",
      "notFound": "Room not found",
      "loadFailed": "Failed to load room data"
    }
  }
}
```


**Indonesian Translation File** (`locales/id.json`):
```json
{
  "room": {
    "create": {
      "title": "Tambah Kamar",
      "roomNumber": "Nomor Kamar",
      "roomType": "Tipe Kamar",
      "monthlyRent": "Sewa Bulanan",
      "submit": "Buat Kamar",
      "cancel": "Batal",
      "success": "Kamar berhasil dibuat"
    },
    "edit": {
      "title": "Edit Kamar",
      "submit": "Simpan Perubahan",
      "success": "Kamar berhasil diperbarui"
    },
    "list": {
      "title": "Kamar",
      "empty": "Tidak ada kamar",
      "filterAll": "Semua Kamar",
      "filterAvailable": "Tersedia",
      "filterOccupied": "Terisi",
      "filterRenovation": "Dalam Renovasi"
    },
    "detail": {
      "title": "Detail Kamar",
      "edit": "Edit",
      "changeStatus": "Ubah Status"
    },
    "status": {
      "available": "Tersedia",
      "occupied": "Terisi",
      "under_renovation": "Dalam Renovasi",
      "updateSuccess": "Status kamar berhasil diperbarui"
    },
    "validation": {
      "roomNumberRequired": "Nomor kamar wajib diisi",
      "roomTypeRequired": "Tipe kamar wajib diisi",
      "monthlyRentRequired": "Sewa bulanan wajib diisi",
      "monthlyRentPositive": "Sewa bulanan harus positif"
    },
    "errors": {
      "duplicateRoomNumber": "Nomor kamar sudah ada",
      "notFound": "Kamar tidak ditemukan",
      "loadFailed": "Gagal memuat data kamar"
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

function RoomList() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('room.list.title')}</h2>
      <div className="flex gap-2 mb-4">
        <button>{t('room.list.filterAll')}</button>
        <button>{t('room.list.filterAvailable')}</button>
        <button>{t('room.list.filterOccupied')}</button>
        <button>{t('room.list.filterRenovation')}</button>
      </div>
      {/* Room cards */}
    </div>
  );
}
```


### API Route Implementation

**POST /api/rooms**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createRoomSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createRoomSchema.parse(body);
    
    const room = await prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        monthlyRent: data.monthlyRent,
        status: 'available'
      }
    });
    
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (error.code === 'P2002') { // Prisma unique constraint violation
      return NextResponse.json(
        { error: 'Room number already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```


**GET /api/rooms**:
```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const where = status ? { status } : {};
    
    const rooms = await prisma.room.findMany({
      where,
      orderBy: { roomNumber: 'asc' }
    });
    
    return NextResponse.json({
      rooms,
      count: rooms.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**PATCH /api/rooms/:id/status**:
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = updateRoomStatusSchema.parse(body);
    
    const room = await prisma.room.update({
      where: { id: params.id },
      data: { status }
    });
    
    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (error.code === 'P2025') { // Prisma record not found
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```


### Performance Optimization

**Query Optimization**:
```typescript
// Use indexes for filtering
const rooms = await prisma.room.findMany({
  where: { status: 'available' }, // Uses idx_rooms_status index
  orderBy: { roomNumber: 'asc' }
});
```

**Pagination for Large Lists**:
```typescript
const PAGE_SIZE = 50;

async function listRooms(page: number = 1, status?: string) {
  const where = status ? { status } : {};
  
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { roomNumber: 'asc' }
    }),
    prisma.room.count({ where })
  ]);
  
  return {
    rooms,
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

function useRooms(status?: string) {
  return useQuery({
    queryKey: ['rooms', status],
    queryFn: () => fetchRooms(status),
    staleTime: 30000 // 30 seconds
  });
}

function useCreateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      // Invalidate and refetch room list
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
  });
}
```


### Security Considerations

**Input Sanitization**:
- All string inputs are trimmed before validation
- Room number uniqueness prevents duplicate entries
- Monthly rent validation prevents negative or zero values
- Zod schema validation on both client and server

**SQL Injection Prevention**:
- Prisma uses parameterized queries automatically
- No raw SQL queries in MVP
- All user inputs validated before database operations

**Authorization** (Post-MVP):
- Implement row-level security in Supabase
- Verify user has permission to access/modify rooms
- Audit log for all CRUD operations

### Deployment Considerations

**Database Migration**:
```bash
# Generate migration
npx prisma migrate dev --name add_rooms_table

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
- Bulk room import from CSV/Excel
- Room photo upload and storage
- Detailed room specifications (square footage, amenities, floor plan)
- Room maintenance scheduling and work order tracking
- Pricing management with seasonal rates or discounts
- Room history and audit logs
- Integration with external property management systems
- Automated room status transitions based on tenant events
- Room availability calendar view
- Advanced search with multiple filters (price range, room type, etc.)
- Room comparison feature
- Room reservation system
- QR code generation for room identification
- Room occupancy analytics and reporting

**Post-MVP Considerations**:
- Real-time updates using Supabase Realtime for status changes
- Offline support with local storage sync
- Advanced validation (room number format patterns)
- Duplicate room detection with fuzzy matching
- Room merge functionality for consolidating records
- Historical status tracking (when room became available/occupied)
- Integration with IoT devices for automated status updates
- Custom fields for room attributes
- Tags and categories for room organization
- Room templates for quick creation of similar rooms
- Batch status updates for multiple rooms
- Room availability forecasting based on historical data

