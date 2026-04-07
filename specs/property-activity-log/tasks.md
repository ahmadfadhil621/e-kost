# Tasks: Property Activity Log

## Phase 0 — Schema (requires user approval)

- [ ] Present `ActivityLog` schema to user for review
- [ ] User applies schema change in Supabase
- [ ] Run `npx prisma db pull && npx prisma generate`

## Phase 1 — Domain Layer

- [ ] `src/domain/schemas/activity-log.ts` — Zod schemas, enums, TypeScript types
- [ ] `src/domain/interfaces/activity-log-repository.ts` — `IActivityLogRepository` interface

## Phase 2 — Repository Layer

- [ ] `src/lib/repositories/prisma/activity-log-repository.ts` — Prisma implementation
  - `create(data)` — insert one log entry
  - `findByProperty(propertyId, opts)` — cursor-paginated query with optional area/actor filters

## Phase 3 — Service Layer

- [ ] `src/lib/activity-log-service.ts`
  - `logActivity(input)` — fire-and-forget helper
  - `ActivityLogService.getActivityFeed(userId, propertyId, opts)` — access-controlled query

## Phase 4 — Integration (wire logActivity into existing services)

- [ ] `src/lib/payment-service.ts` — log PAYMENT_RECORDED, PAYMENT_UPDATED, PAYMENT_DELETED
- [ ] `src/lib/expense-service.ts` — log EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED
- [ ] `src/lib/tenant-service.ts` — log TENANT_ASSIGNED, TENANT_UNASSIGNED, TENANT_MOVED, TENANT_UPDATED
- [ ] `src/lib/room-service.ts` — log ROOM_CREATED, ROOM_UPDATED, ROOM_ARCHIVED
- [ ] Property settings service/route — log SETTINGS_STAFF_FINANCE_TOGGLED, SETTINGS_PROPERTY_UPDATED

## Phase 5 — API Route

- [ ] `src/app/api/properties/[propertyId]/activity/route.ts`
  - `GET` — fetch activity feed with cursor pagination + filters

## Phase 6 — UI Components

- [ ] `src/components/activity/ActivityFeed.tsx` — TanStack Query, infinite load
- [ ] `src/components/activity/ActivityEntry.tsx` — single entry row
- [ ] `src/components/activity/ActivityFilters.tsx` — area + actor filter dropdowns

## Phase 7 — Page & Navigation

- [ ] `src/app/(app)/properties/[propertyId]/activity/page.tsx`
- [ ] Add "Activity" link to property navigation

## Phase 8 — i18n

- [ ] Add `activity.*` keys to `locales/en.json`
- [ ] Add `activity.*` keys to `locales/id.json`

## Phase 9 — Tests

- [ ] Vitest: domain schemas, service layer, API route
- [ ] Playwright E2E: activity feed page

## Phase 10 — Regression

- [ ] `npm run test:run` — no regressions
- [ ] `npm run test:e2e` — runs in CI on push
