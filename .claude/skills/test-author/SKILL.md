---
name: test-author
description: Write TDD unit and integration test suites for E-Kost features. Use when writing Vitest tests for domain services, API routes, or UI components. Covers Good/Bad/Edge structure, property-based tests with fast-check, test fixtures, and MSW handlers. For Playwright E2E tests, use the e2e-test-author skill instead.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Test Author (Unit & Integration)

Write Vitest tests as part of the issue-driven TDD workflow. For testing conventions and structure, see `.claude/rules/testing.md`.

## Workflow

1. Read the feature's spec files:
   - `specs/<feature>/requirements.md` -- acceptance criteria
   - `specs/<feature>/design.md` -- correctness properties, test data generators, interfaces
2. Create test fixtures in `src/test/fixtures/` if they don't exist yet
3. Create MSW handlers in `src/test/mocks/` for any API endpoints the feature uses
4. Write test files co-located with source: `<module>.test.ts` or `<component>.test.tsx`
5. Add traceability comments to each test file (see Traceability Matrix below)
6. Run `npx vitest run <path>` to verify tests are syntactically correct (they should fail since implementation doesn't exist yet)
7. Hand off to E2E tests using the `/e2e-test-author` skill

## Factory Functions

Create in `src/test/fixtures/`. One factory per entity with sensible defaults and override support:

```typescript
// src/test/fixtures/room.ts
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

Always use factory functions -- never inline test data objects.

## MSW Handlers

Create in `src/test/mocks/handlers.ts`. Group by feature:

```typescript
import { http, HttpResponse } from 'msw';

export const roomHandlers = [
  http.get('/api/rooms', () => HttpResponse.json({ rooms: [], count: 0 })),
  http.post('/api/rooms', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: crypto.randomUUID(), ...body, status: 'available' }, { status: 201 });
  }),
];
```

## Property-Based Tests

One test per correctness property from `specs/<feature>/design.md`. Each must run minimum 100 iterations:

```typescript
import fc from 'fast-check';

// Feature: room-inventory-management, Property 1: Room Creation Completeness
it('room creation returns complete object with ID, status, and timestamp', () => {
  fc.assert(
    fc.property(
      fc.record({
        roomNumber: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        monthlyRent: fc.float({ min: 0.01, max: 100000, noNaN: true }),
      }),
      async (roomData) => {
        const result = await roomService.createRoom(roomData);
        expect(result.id).toBeDefined();
        expect(result.status).toBe('available');
      }
    ),
    { numRuns: 100 }
  );
});
```

## Traceability Matrix

Every test file must include traceability comments mapping spec items to tests:

```typescript
// Traceability: <feature-name>
// REQ 1.2 -> it('creates a room with valid data')
// REQ 1.3 -> it('rejects when room number is missing')
// PROP 1  -> it('room creation returns complete object with ID, status, and timestamp')
```

Rules:
- `REQ X.Y` for acceptance criteria, `PROP N` for correctness properties
- If a criterion is covered by E2E, note it: `// REQ 1.1 -> (covered by E2E create-room.spec.ts)`

## Hard Constraints

- Test files are the source of truth -- implementation must not modify them
- Never mock internal business logic -- only mock external dependencies (Prisma, Better Auth, fetch)
- Always use factory functions from `src/test/fixtures/`
- Every test file must cover good, bad, and edge cases
- Property-based tests must run minimum 100 iterations

## Reference Files

Before writing tests, always read:
1. `specs/<feature>/requirements.md` -- acceptance criteria
2. `specs/<feature>/design.md` -- correctness properties, test data generators
3. `.claude/rules/testing.md` -- project testing conventions
