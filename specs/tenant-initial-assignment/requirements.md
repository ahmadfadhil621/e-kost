# Tenant Initial Assignment — Requirements

> Issue #124

## Background

`TenantService.assignRoom()` was the original service method for assigning a tenant to their first room. It updates `Tenant.roomId` and `Tenant.movedInAt` but never inserts a `room_assignment` row. The XLSX payment export (issue #121) reads room info exclusively from `room_assignment`, so any tenant assigned through this code path shows a blank Room column in the export.

Investigation revealed that `assignRoom()` is unreachable from the live app: the UI "Assign Room" dialog routes through `moveTenantToRoom()` (via `POST /api/.../tenants/[id]/move`), which already creates `room_assignment` rows correctly. `assignRoom()` has no API entry point and no live callers outside of unit tests.

The actual root cause of the blank Room column in the XLSX export is the seed scripts, which bypass the service entirely and never insert `room_assignment` rows.

## Acceptance Criteria

### AC-1: Seed scripts insert room_assignment rows

- Given `src/lib/demo-seed.ts` runs and creates tenants with room assignments
- When any of those tenants have payments recorded
- Then the XLSX payment export shows the correct room number for each payment row

- Given `scripts/seed-demo.ts` runs and creates tenants with room assignments
- When any of those tenants have payments recorded
- Then the XLSX payment export shows the correct room number for each payment row

### AC-2: `assignRoom()` dead code is removed

- `TenantService.assignRoom()` method is deleted
- `ITenantRepository.assignRoom()` is removed from the interface
- `PrismaTenantRepository.assignRoom()` implementation is deleted
- All unit tests for `assignRoom()` in `tenant-service.test.ts` and `tenant-service.fault-injection.test.ts` are deleted
- All `assignRoom: vi.fn()` stubs are removed from test files that mock `ITenantRepository`
- All tests continue to pass after the cleanup

## Out of Scope

- Data migration / backfilling `room_assignment` rows for tenants created in production before this fix
- Any UI changes (the assign dialog already works correctly via `moveTenantToRoom`)
- Adding a dedicated `/assign` API endpoint separate from `/move`
- Changing how `moveTenantToRoom` works
