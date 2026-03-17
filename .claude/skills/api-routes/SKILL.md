---
name: api-routes
description: Implement API routes and repository layer for E-Kost features. Use when building REST endpoints under src/app/api/, implementing Prisma repository classes, or wiring up the service layer.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# API Routes & Repositories

For coding conventions, see `.claude/rules/coding-standards.md`.

## Workflow

1. Read the feature's spec files:
   - `specs/<feature>/design.md` -- API routes, service interfaces, data models
   - `specs/architecture-intent.md` -- layered architecture
2. Implement or extend repository interface in `src/domain/interfaces/`
3. Implement the Prisma repository in `src/lib/repositories/prisma/`
4. Implement or extend the service in `src/lib/`
5. Create the API route files in `src/app/api/`
6. Run `npx vitest run` to verify all tests pass

## Layered Call Chain

```
API Route → Service → Repository → Prisma
```

Never call Prisma directly from a route. Never skip layers.

## API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRoomSchema } from '@/domain/schemas/room';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await verifySession(request);
    if (error) return error;

    const body = await request.json();
    const data = createRoomSchema.parse(body);

    const room = await roomService.createRoom(data);

    return NextResponse.json({ data: room }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return handleServiceError(error);
  }
}
```

## HTTP Status Codes

| Status | When |
|--------|------|
| 200 | Successful read/update |
| 201 | Successful create |
| 400 | Validation failure |
| 401 | Not authenticated |
| 404 | Resource not found |
| 409 | Business rule conflict |
| 500 | Unexpected server error |

## Error Handling

Always return `{ error: string }`. Never expose stack traces or internal details. No PII in logs or error messages.

```typescript
function handleServiceError(error: unknown): NextResponse {
  if (isPrismaError(error, 'P2002')) {
    return NextResponse.json({ error: 'Record already exists' }, { status: 409 });
  }
  if (isPrismaError(error, 'P2025')) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }
  console.error('Unhandled error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

## Repository Interface Pattern

```typescript
// src/domain/interfaces/room-repository.ts
export interface IRoomRepository {
  create(data: CreateRoomInput): Promise<Room>;
  findById(id: string): Promise<Room | null>;
  findMany(filters?: RoomFilters): Promise<Room[]>;
  update(id: string, data: UpdateRoomInput): Promise<Room>;
}
```

## Key Prisma Patterns

**Soft-delete filter** -- always exclude moved-out tenants:
```typescript
where: { movedOutAt: null }
```

**Atomic transactions** -- for multi-table operations:
```typescript
return prisma.$transaction(async (tx) => {
  // verify, update tenant, update room...
});
```

**Avoid N+1** -- use `include`/`select` for related data in a single query.

## Hard Constraints

- All request input validated with Zod schemas from `src/domain/schemas/`
- Error responses always use `{ error: string }` shape
- No PII in logs or error messages
- Verify Better Auth session on every route
- Monetary values use `Decimal(10,2)` in Prisma

## Reference Files

1. `specs/<feature>/design.md` -- API routes, data models
2. `specs/architecture-intent.md` -- layered architecture
3. `.claude/rules/coding-standards.md` -- conventions
