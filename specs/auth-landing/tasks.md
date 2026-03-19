# Tasks: Auth Landing (Server-Side Redirect)

## Task List

- [x] 1. Write Vitest unit tests for `src/middleware.ts` (`/test-author`)
- [x] 2. Write E2E test: authenticated user visiting `/login` redirects to `/` (`/e2e-test-author`)
- [x] 3. Validate tests (`/test-validator`)
- [x] 4. Implement `src/middleware.ts`
- [x] 5. Run `npm run test:run` — all tests pass
- [x] 6. Push and confirm E2E tests pass in CI

## Traceability

| Requirement | Task |
|-------------|------|
| REQ 1.1 | Vitest: unauthenticated on `/` → redirect `/login` |
| REQ 1.2 | Vitest: unauthenticated on `/settings` → redirect `/login` |
| REQ 1.3 | Vitest: unauthenticated on `/login` → pass through |
| REQ 1.4 | Vitest: unauthenticated on `/register` → pass through |
| REQ 2.1 | Vitest: authenticated on `/login` → redirect `/` |
| REQ 2.2 | Vitest: authenticated on `/register` → redirect `/` |
| REQ 2.3 | Vitest: authenticated on `/` → pass through |
| REQ 3.1–3.3 | Matcher config (tested via middleware exclusion edge case) |
