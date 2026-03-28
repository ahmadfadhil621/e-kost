# Design — Persist Language Preference at Account Level

## Schema Change

```prisma
model User {
  // ... existing fields
  language String @default("en")  // NEW
}
```

**Requires explicit user approval before editing `prisma/schema.prisma`.**

## API Routes

### PATCH /api/user/language
- Auth: `getSession(request)` — 401 if unauthenticated
- Input: `{ language: "en" | "id" }` (validated via Zod using `AVAILABLE_LOCALES`)
- Calls `userService.updateLanguage(userId, language)`
- Returns `{ data: { language: string } }` (200) or `{ error: string }` (400/401/500)

### GET /api/user/language
- Auth: `getSession(request)` — 401 if unauthenticated
- Returns `{ data: { language: string } }` (200) or `{ error: string }` (401/500)

## Domain

### `src/domain/schemas/user.ts` (new)
```ts
export const updateLanguageSchema = z.object({
  language: z.enum(AVAILABLE_LOCALES as [string, ...string[]]),
});
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
```

## Service Layer

### `src/lib/user-service.ts` (new)
```ts
export const userService = {
  getLanguage(userId: string): Promise<string>
  updateLanguage(userId: string, language: string): Promise<string>
}
```
Uses Prisma directly (no separate repository interface).

## Hook

### `src/hooks/use-language-sync.ts` (new)
- Calls `useAuth()` to get current user
- When `user` is non-null: fetches `GET /api/user/language` with React Query
- On success: calls `i18n.changeLanguage(language)` if it differs from current
- On error: no-op (localStorage fallback remains)

## UI Changes

### `src/components/settings/LanguageSelector.tsx`
- Calls `useAuth()` internally to detect authentication state
- After `i18n.changeLanguage(code)` + localStorage write, fires `PATCH /api/user/language` only when authenticated (fire-and-forget)

### `src/app/(app)/layout.tsx` — `AppLayoutContent`
- Calls `useLanguageSync()` to sync language on auth

## i18n Keys

No new translation strings needed.

## Correctness Properties

### Property 1: Language Persistence Round Trip

*For any* authenticated user who selects a language, the language stored in the database should match the language sent in the PATCH request.

**Validates: Requirements 2.1, 4.1**

### Property 2: Unauthenticated Isolation

*For any* unauthenticated request to either language endpoint, the system should return 401 and never call any database write.

**Validates: Requirements 2.2, 2.5**

### Property 3: Validation Boundary

*For any* language value not in `AVAILABLE_LOCALES`, the PATCH endpoint should return 400 and leave the database unchanged.

**Validates: Requirement 2.3**

### Property 4: App Load Sync

*For any* authenticated session, calling `useLanguageSync` should result in `i18n.changeLanguage` being called with the server-persisted value (when the value differs from the current i18n language).

**Validates: Requirement 3.1**

## Sequence: Language Selection (Authenticated)

```
User clicks "id" in LanguageSelector
  → i18n.changeLanguage("id")  (instant)
  → localStorage.setItem("ekost_language", "id")  (instant)
  → fetch PATCH /api/user/language { language: "id" }  (background, fire-and-forget)
      → userService.updateLanguage(userId, "id")
          → prisma.user.update({ where: { id: userId }, data: { language: "id" } })
```

## Sequence: App Load (Authenticated)

```
AppLayoutContent mounts
  → useLanguageSync() fires
      → useAuth() — user available
      → fetch GET /api/user/language
          → userService.getLanguage(userId)
              → prisma.user.findUnique({ select: { language: true } })
      → i18n.changeLanguage(storedLanguage)  (if differs from current)
```
