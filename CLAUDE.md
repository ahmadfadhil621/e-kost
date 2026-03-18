# E-Kost

A mobile-first web app for small landlords to manage rental rooms, tenants, payments, and balances.

## Quick Setup

```bash
cp .env.example .env          # Fill in DATABASE_URL + BETTER_AUTH_SECRET
npm install
npx prisma db push
npx playwright install chromium  # For E2E tests
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production (includes prisma generate) |
| `npm run lint` | ESLint check |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest with coverage |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:validate` | Validate test structure |
| `npm run test:validate:feature -- <name>` | Validate tests for a specific feature |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:cleanse` | Cleanse database (scripts/cleanse-database.ts) |

## Architecture (5 Layers)

1. **Domain** (`src/domain/`) — Zod schemas, repository interfaces. No framework imports.
2. **Service** (`src/lib/*-service.ts`) — Business logic. Depends on repository interfaces, not implementations.
3. **API** (`src/app/api/`) — Next.js route handlers. Validates with Zod, calls services, returns `{ data }` or `{ error }`.
4. **Repository** (`src/lib/repositories/prisma/`) — Prisma implementations behind interfaces.
5. **UI** (`src/components/`, `src/app/(app)/`, `src/app/(auth)/`) — React components. No business logic.

Routes call services, services call repositories. Never skip layers.

## Development Workflow (Issue-Driven TDD)

All work starts from a GitHub issue. See `.github/ISSUE_TEMPLATE/` for templates (bug, enhancement, ux, cleanup).

| Step | Action | Details |
|------|--------|---------|
| 1 | **GitHub Issue** | Read the issue. Understand scope, constraints, and definition of done. |
| 2 | **Derive Specs** | Create `specs/<feature>/requirements.md` → `design.md` → `tasks.md` (in that order). |
| 3 | **Write Vitest Tests** | Unit/integration tests. Good/Bad/Edge structure. Use `/test-author` skill. |
| 4 | **Write E2E Tests** | Playwright tests for atomic user actions. Use `/e2e-test-author` skill. |
| 5 | **Validate Tests** | Run 3 quality gates: structural, fault injection, review checklist. Use `/test-validator` skill. |
| 6 | **Implement** | Write production code to make all tests pass. Layer by layer. |
| 7 | **Iterate** | If tests fail, fix implementation — never weaken tests. Tests are source of truth. |
| 8 | **Regression** | Run `npm run test:run`. Fix regressions in implementation. E2E tests run in CI — push to trigger. |
| 9 | **Commit** | Pause at logical boundaries. Propose commit message. User handles git. |

Tests are the source of truth. Only modify tests if they are genuinely broken or incorrect — this should be rare.

Full workflow details: `docs/development-workflow.md`

## Commit Format

Conventional commits: `type(scope): description`
Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Important Paths

| Path | Purpose |
|------|---------|
| `specs/` | Feature specifications (requirements, design, tasks) |
| `prisma/schema.prisma` | Database schema |
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/ISSUE_TEMPLATE/` | Issue templates (bug, enhancement, ux, cleanup) |
| `src/domain/schemas/` | Shared Zod schemas |
| `src/domain/interfaces/` | Repository interfaces |
| `src/test/fixtures/` | Test factory functions |
| `locales/` | i18n translation files (en, id) |

## Protected Files — DO NOT modify without explicit user approval

- `prisma/schema.prisma` — Database schema changes affect the entire stack
- `.github/workflows/ci.yml` — CI pipeline changes affect all contributors
