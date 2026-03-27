# Invite-Only Registration Design

## Domain Layer
- `src/domain/schemas/invite.ts` — Zod schemas for InviteToken, CreateInviteInput
- `src/domain/interfaces/invite-repository.ts` — IInviteRepository interface

## Service Layer
- `src/lib/invite-service.ts` — InviteService with create/validate/redeem/list/revoke

## Repository Layer
- `src/lib/repositories/prisma/prisma-invite-repository.ts` — STUB (schema migration pending)

## API Routes
- `POST /api/invites` — create invite (authenticated)
- `GET /api/invites` — list invites for current user (authenticated)
- `GET /api/invites/validate?token=xxx` — validate token (public)
- `POST /api/invites/redeem` — redeem token (public, called after sign-up)
- `DELETE /api/invites/[id]` — revoke invite (authenticated)

## UI Components
- `src/app/(auth)/register/page.tsx` — reads `?token` from URL
- `src/components/auth/registration-form.tsx` — validates invite, pre-fills email
- `src/components/settings/InviteSection.tsx` — owner invite management UI

## i18n Keys
- `auth.register.inviteRequired`
- `auth.register.inviteInvalid`
- `auth.register.inviteLoading`
- `auth.register.emailPreFilled`
- `settings.invites.*`

## Correctness Properties
- Token is a UUID (unforgeable)
- Expired tokens are rejected (time-bounded)
- Used tokens cannot be reused (one-time use)
- Only creator can revoke their invites
