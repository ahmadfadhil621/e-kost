---
name: e-kost-api-routes
description: Implement API routes and repository layer for E-Kost features. Use when building REST endpoints under src/app/api/, implementing Prisma repository classes, or wiring up the service layer. Covers Zod validation, error handling, auth middleware, and database queries.
---

# E-Kost API Routes & Repositories

## Workflow

1. Read the feature's spec files:
   - `specs/<feature>/design.md` -- API Routes section (route definitions, request/response schemas), Components and Interfaces section (service interfaces), Data Models section (Prisma schema, query patterns)
   - `specs/architecture-intent.md` -- layered architecture, ports & adapters
   - `.cursor/rules/coding-standards.mdc` -- error handling, naming, validation conventions
2. Implement or extend repository interface in `src/lib/repositories/`
3. Implement the Prisma repository in `src/lib/repositories/prisma/`
4. Implement or extend the service in `src/lib/services/`
5. Create the API route files in `src/app/api/`
6. Run existing tests: `npx vitest run` to verify all tests pass

## Layered Call Chain

Routes must never skip layers:

```
API Route -> Service -> Repository -> Prisma
```

- **API Route** (`src/app/api/`): Parses input (Zod), calls service, formats HTTP response
- **Service** (`src/lib/services/`): Orchestrates business logic, calls repository interface
- **Repository** (`src/lib/repositories/`): Interface defines contract, Prisma adapter implements it

## API Route Pattern

Every route follows this structure:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRoomSchema } from '@/lib/validations/room';
import { roomService } from '@/lib/services/room-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createRoomSchema.parse(body);

    const room = await roomService.createRoom(data);

    return NextResponse.json({ data: room }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return handleServiceError(error);
  }
}
```

## Zod Schemas

Import shared schemas from `src/lib/validations/`. Never define schemas inline in route files.

```typescript
// src/lib/validations/room.ts
import { z } from 'zod';

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').max(50).trim(),
  roomType: z.string().min(1, 'Room type is required').max(100).trim(),
  monthlyRent: z.number().positive('Monthly rent must be positive'),
});

export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1).max(50).trim().optional(),
  roomType: z.string().min(1).max(100).trim().optional(),
  monthlyRent: z.number().positive().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const updateRoomStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'under_renovation']),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
```

## Error Handling

### HTTP Status Codes

| Status | When | Example |
|--------|------|---------|
| 200 | Successful read/update | GET room, PATCH status |
| 201 | Successful create | POST new room |
| 400 | Validation failure | Missing field, invalid email, negative rent |
| 401 | Not authenticated | No Supabase session |
| 404 | Resource not found | Room ID doesn't exist |
| 409 | Business rule conflict | Duplicate room number, room already occupied |
| 500 | Unexpected server error | Unhandled exception |
| 503 | Service unavailable | Database connection failure |

### Error Response Shape

Always return `{ error: string }`. Never expose stack traces or internal details.

```typescript
// Consistent error helper
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

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === code
  );
}
```

### No PII in Errors or Logs

Never include tenant names, emails, or phone numbers in error messages or `console.error` output.

## Auth Middleware

Verify Supabase session on all routes. Extract into a reusable helper:

```typescript
// src/lib/auth/verify-session.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function verifySession(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user, error: null };
}
```

Usage in routes:

```typescript
export async function GET(request: NextRequest) {
  const { user, error } = await verifySession(request);
  if (error) return error;

  // proceed with authenticated user...
}
```

## Repository Interface Pattern

Define interfaces in `src/lib/repositories/`. Implementations go in `src/lib/repositories/prisma/`.

```typescript
// src/lib/repositories/room-repository.ts
import type { Room, CreateRoomInput, UpdateRoomInput, RoomFilters } from '@/lib/domain/types';

export interface IRoomRepository {
  create(data: CreateRoomInput): Promise<Room>;
  findById(id: string): Promise<Room | null>;
  findMany(filters?: RoomFilters): Promise<Room[]>;
  update(id: string, data: UpdateRoomInput): Promise<Room>;
  updateStatus(id: string, status: string): Promise<Room>;
  count(filters?: RoomFilters): Promise<number>;
}
```

## Prisma Repository Implementation

```typescript
// src/lib/repositories/prisma/prisma-room-repository.ts
import { prisma } from '@/lib/prisma';
import type { IRoomRepository } from '../room-repository';

export class PrismaRoomRepository implements IRoomRepository {
  async create(data) {
    return prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        monthlyRent: data.monthlyRent,
        status: 'available',
      },
    });
  }

  async findById(id) {
    return prisma.room.findUnique({ where: { id } });
  }

  async findMany(filters) {
    const where = filters?.status ? { status: filters.status } : {};
    return prisma.room.findMany({
      where,
      orderBy: { roomNumber: 'asc' },
    });
  }

  // ...
}
```

### Key Prisma Patterns

**Soft-delete filter** -- always exclude moved-out tenants by default:

```typescript
async findMany() {
  return prisma.tenant.findMany({
    where: { movedOutAt: null },
    include: { room: { select: { id: true, roomNumber: true, roomType: true } } },
  });
}
```

**Avoid N+1** -- use `include`/`select` for related data:

```typescript
async findManyWithRoom() {
  return prisma.tenant.findMany({
    where: { movedOutAt: null },
    include: {
      room: { select: { id: true, roomNumber: true, monthlyRent: true } },
    },
  });
}
```

**Atomic transactions** -- for operations that update multiple tables:

```typescript
async assignRoom(tenantId: string, roomId: string) {
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== 'available') {
      throw new Error('Room is not available');
    }

    const tenant = await tx.tenant.update({
      where: { id: tenantId },
      data: { roomId },
    });

    await tx.room.update({
      where: { id: roomId },
      data: { status: 'occupied' },
    });

    return tenant;
  });
}
```

**Pagination** -- for list endpoints supporting 1,000+ records:

```typescript
async findManyPaginated(page: number = 1, pageSize: number = 50, filters?: RoomFilters) {
  const where = filters?.status ? { status: filters.status } : {};

  const [items, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { roomNumber: 'asc' },
    }),
    prisma.room.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
```

**Balance calculation query** -- JOIN tenant + room, SUM payments:

```typescript
async calculateBalance(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { room: { select: { monthlyRent: true } } },
  });

  const result = await prisma.payment.aggregate({
    where: { tenantId },
    _sum: { amount: true },
  });

  const monthlyRent = Number(tenant?.room?.monthlyRent ?? 0);
  const totalPayments = Number(result._sum.amount ?? 0);
  const outstandingBalance = Math.max(0, monthlyRent - totalPayments);

  return {
    tenantId,
    monthlyRent,
    totalPayments,
    outstandingBalance,
    status: outstandingBalance <= 0 ? 'paid' : 'unpaid',
  };
}
```

## Route File Naming

Follow Next.js App Router conventions:

```
src/app/api/
  rooms/
    route.ts              -- GET (list), POST (create)
    [id]/
      route.ts            -- GET (detail), PUT (update)
      status/
        route.ts          -- PATCH (status update)
  tenants/
    route.ts              -- GET (list), POST (create)
    [id]/
      route.ts            -- GET (detail), PUT (update)
      assign-room/
        route.ts          -- POST
      move-out/
        route.ts          -- POST
      payments/
        route.ts          -- GET (per-tenant payments)
      balance/
        route.ts          -- GET
    balances/
      route.ts            -- GET (all tenant balances)
  payments/
    route.ts              -- GET (list), POST (create)
    [id]/
      route.ts            -- GET (detail)
  auth/
    register/
      route.ts            -- POST
    login/
      route.ts            -- POST
    logout/
      route.ts            -- POST
    session/
      route.ts            -- GET
```

## Hard Constraints

- Routes call services, services call repositories. Never call Prisma directly from a route.
- All request input validated with Zod schemas from `src/lib/validations/`.
- Error responses always use `{ error: string }` shape.
- No PII (tenant name, email, phone) in logs or error messages.
- Verify Supabase session on every route.
- Monetary values use `Decimal(10,2)` in Prisma, convert with `Number()` at service boundary.

## Reference Files

Before implementing routes for a feature, always read:
1. `specs/<feature>/design.md` -- API Routes section for route definitions and schemas, Data Models section for Prisma queries, Components and Interfaces section for service interfaces
2. `specs/architecture-intent.md` -- layered architecture rules, repository pattern
3. `.cursor/rules/coding-standards.mdc` -- naming, error handling, TypeScript conventions
