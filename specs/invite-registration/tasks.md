# Implementation Tasks

## Layer 1: Domain
- [x] Create `src/domain/schemas/invite.ts`
- [x] Create `src/domain/interfaces/invite-repository.ts`
- [x] Create `src/test/fixtures/invite.ts`

## Layer 2: Service (TDD)
- [x] Write `src/lib/invite-service.test.ts`
- [x] Write `src/lib/invite-service.fault-injection.test.ts`
- [x] Implement `src/lib/invite-service.ts`

## Layer 3: Repository (Stub)
- [x] Create `src/lib/repositories/prisma/prisma-invite-repository.ts` (stub)
- [x] Create `src/lib/invite-service-instance.ts`

## Layer 4: API
- [x] `src/app/api/invites/route.ts` (POST, GET)
- [x] `src/app/api/invites/validate/route.ts` (GET)
- [x] `src/app/api/invites/redeem/route.ts` (POST)
- [x] `src/app/api/invites/[id]/route.ts` (DELETE)

## Layer 5: UI
- [x] Update `src/app/(auth)/register/page.tsx`
- [x] Update `src/components/auth/registration-form.tsx`
- [x] Create `src/components/settings/InviteSection.tsx`

## Layer 6: i18n
- [x] Update `locales/en.json`
- [x] Update `locales/id.json`

## Layer 7: Scripts
- [x] Create `scripts/seed-owner.ts`
- [x] Add `db:seed-owner` to `package.json`

## TODO (post schema migration)
- [ ] Add InviteToken model to prisma/schema.prisma
- [ ] Run `npx prisma db push`
- [ ] Replace stub with real PrismaInviteRepository implementation
