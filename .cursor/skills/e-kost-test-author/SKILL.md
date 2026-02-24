---
name: e-kost-test-author
description: Write TDD test suites for E-Kost features. Use when writing tests for domain services, API routes, or UI components. Covers unit tests with Good/Bad/Edge structure, property-based tests with fast-check, test fixtures, and MSW handlers.
---

# E-Kost Test Author

## Workflow

1. Read the feature's spec files:
   - `specs/<feature>/design.md` -- correctness properties, test data generators, interfaces
   - `specs/<feature>/requirements.md` -- acceptance criteria
   - `.cursor/rules/testing.mdc` -- project testing standards
2. Create test fixtures in `src/test/fixtures/` if they don't exist yet
3. Create MSW handlers in `src/test/mocks/` for any API endpoints the feature uses
4. Write test files co-located with source: `<module>.test.ts` or `<component>.test.tsx`
5. Run `npx vitest run <path>` to verify tests are syntactically correct (they should fail since implementation doesn't exist yet)

## Test File Structure

Every test file uses the Good/Bad/Edge pattern:

```typescript
import { describe, it, expect } from 'vitest';

describe('RoomService.create', () => {
  describe('good cases', () => {
    it('creates a room with valid data', async () => { /* ... */ });
  });
  describe('bad cases', () => {
    it('rejects when room number is missing', async () => { /* ... */ });
    it('rejects when monthly rent is negative', async () => { /* ... */ });
  });
  describe('edge cases', () => {
    it('handles duplicate room numbers', async () => { /* ... */ });
    it('handles maximum field lengths', async () => { /* ... */ });
  });
});
```

## Test Naming

- Files: `<module>.test.ts` (services, validators) or `<component>.test.tsx` (React components)
- Co-located next to the source file they test
- Descriptive names: `it('returns 400 when tenant name is empty')`

## What to Test per Layer

### Domain/Services (`src/lib/`)
- Business rules, validation, calculations, state transitions
- Mock repository interfaces -- never mock internal business logic

### API Routes (`src/app/api/`)
- Valid requests: 200/201 with correct response shape
- Invalid input: 400 with `{ error: string }`
- Not found: 404
- Conflicts: 409 (duplicate, occupied room, etc.)
- Auth failures: 401

### Components (`src/components/`)
- Rendering with expected content
- User interactions (form submit, button click, dropdown select)
- Form validation feedback (inline errors)
- Empty state, loading state, error state
- Mobile layout assertions (use container queries or snapshot at 320px)
- Accessibility: form labels exist, ARIA attributes present

## Factory Functions

Create in `src/test/fixtures/`. One factory per entity with sensible defaults and override support:

```typescript
// src/test/fixtures/room.ts
import type { Room } from '@/lib/domain/types';

export function createRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: crypto.randomUUID(),
    roomNumber: 'A101',
    roomType: 'single',
    monthlyRent: 1500000,
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

```typescript
// src/test/fixtures/tenant.ts
import type { Tenant } from '@/lib/domain/types';

export function createTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: crypto.randomUUID(),
    name: 'John Doe',
    phone: '081234567890',
    email: 'john@example.com',
    roomId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    movedOutAt: null,
    ...overrides,
  };
}
```

```typescript
// src/test/fixtures/payment.ts
import type { Payment } from '@/lib/domain/types';

export function createPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: crypto.randomUUID(),
    tenantId: crypto.randomUUID(),
    amount: 1500000,
    paymentDate: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}
```

Always use factory functions in tests -- never inline object literals for test data.

## MSW Handlers

Create in `src/test/mocks/handlers.ts`. Group by feature:

```typescript
import { http, HttpResponse } from 'msw';

export const roomHandlers = [
  http.get('/api/rooms', () => {
    return HttpResponse.json({ rooms: [], count: 0 });
  }),
  http.post('/api/rooms', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: crypto.randomUUID(), ...body, status: 'available' }, { status: 201 });
  }),
];

export const handlers = [...roomHandlers];
```

Set up the server in `src/test/mocks/server.ts`:

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## Property-Based Tests

One test per correctness property from the feature's `design.md`. Each must:
- Run minimum 100 iterations
- Include a tagging comment referencing the property
- Use test data generators from the design doc

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('property-based tests', () => {
  // Feature: room-inventory-management, Property 1: Room Creation Completeness
  it('room creation returns complete object with ID, status, and timestamp', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomNumber: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          roomType: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          monthlyRent: fc.float({ min: 0.01, max: 100000, noNaN: true }),
        }),
        async (roomData) => {
          const result = await roomService.createRoom(roomData);
          expect(result.id).toBeDefined();
          expect(result.status).toBe('available');
          expect(result.createdAt).toBeInstanceOf(Date);
          expect(result.roomNumber).toBe(roomData.roomNumber);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

Find the correctness properties in each feature's design doc under the **Correctness Properties** section. The number of property tests per feature:
- User Authentication: 10 properties
- Room Inventory: 14 properties
- Tenant & Room Basics: 12 properties
- Payment Recording: 11 properties
- Outstanding Balance: refer to design doc

## Test Setup

Use Vitest setup file for global MSW server lifecycle:

```typescript
// src/test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Arrange-Act-Assert

Always follow the AAA pattern. Separate the three sections with blank lines for readability:

```typescript
it('returns 409 when room number already exists', async () => {
  const existingRoom = createRoom({ roomNumber: 'A101' });
  await roomRepo.save(existingRoom);

  const result = roomService.createRoom({ roomNumber: 'A101', roomType: 'single', monthlyRent: 1500000 });

  await expect(result).rejects.toThrow('Room number already exists');
});
```

## Hard Constraints

- Test files are the **source of truth**. Implementation subagents must NOT modify test files.
- Never mock internal business logic modules -- only mock external dependencies (Prisma, Supabase Auth, fetch).
- Always use factory functions from `src/test/fixtures/` -- never inline test data objects.
- Every test file must cover all three categories: good, bad, and edge cases.
- Property-based tests must run minimum 100 iterations.

## Reference Files

Before writing tests for a feature, always read:
1. `specs/<feature>/design.md` -- Correctness Properties section for property tests, Test Data Generators section for arbitraries, Components and Interfaces section for what to test
2. `specs/<feature>/requirements.md` -- acceptance criteria that inform test assertions
3. `.cursor/rules/testing.mdc` -- project-wide testing conventions
