# E-Kost

@README.md
@docs/development-workflow.md

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

## Code Conventions

- **TypeScript**: Strict mode, no `any`, `const` by default, named exports
- **Naming**: files `kebab-case`, components `PascalCase`, functions `camelCase`, constants `UPPER_SNAKE_CASE`
- **Validation**: Zod schemas shared between frontend and backend (`src/domain/schemas/`)
- **API responses**: Success `{ data: T }`, failure `{ error: string }` with correct HTTP status
- **React**: Functional components, shadcn/ui primitives, React Hook Form + Zod, TanStack Query for data
- **Styling**: Tailwind only, no inline styles, CSS variables in `globals.css`, mobile-first (`320px-480px`)
- **i18n**: All UI text via `useTranslation()`, translations in `locales/en.json` and `locales/id.json`
- **Touch targets**: Minimum `44x44px` on all interactive elements
- **Design principles**: YAGNI, DRY (rule of three), KISS, composition over inheritance, fail fast

## Testing (TDD)

6-step workflow: (1) Write Vitest tests → (2) Write Playwright E2E → (3) Validate quality gates → (4) Implement → (5) Iterate → (6) Full regression

- **Structure**: Good / Bad / Edge cases in every test file
- **Vitest**: Co-located `*.test.ts(x)` files, factory fixtures in `src/test/fixtures/`
- **Playwright**: `e2e/<feature>/<action>.spec.ts`, accessible locators only, mobile viewport
- **Property-based**: fast-check, min 100 iterations, one per correctness property
- **Quality gates**: Gate 1 (structural), Gate 2 (fault injection), Gate 3 (review checklist)
- **Regression rule**: If an old test fails, fix implementation — never weaken old tests

## Commit Format

Conventional commits: `type(scope): description`
Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
Checkpoint at layer boundaries (domain, service, API, UI, i18n).

## Important Paths

| Path | Purpose |
|------|---------|
| `specs/` | Feature specifications (requirements, design, tasks) |
| `prisma/schema.prisma` | Database schema |
| `.github/workflows/ci.yml` | CI pipeline |
| `src/domain/schemas/` | Shared Zod schemas |
| `src/domain/interfaces/` | Repository interfaces |
| `src/test/fixtures/` | Test factory functions |
| `locales/` | i18n translation files (en, id) |

## Protected Files — DO NOT modify without explicit user approval

- `prisma/schema.prisma` — Database schema changes affect the entire stack
- `.github/workflows/ci.yml` — CI pipeline changes affect all contributors

## Cross-Cutting Constraints

- **Mobile-first**: 320-480px viewport, single-column, no horizontal scroll
- **i18n**: Never hardcode strings, use `Intl.NumberFormat` for currency (EUR default)
- **Data integrity**: UTC timestamps, soft delete for move-out, immutable UUIDs
- **Accessibility**: WCAG AA contrast, labels on all fields, keyboard-accessible, color + icon + text
- **Performance**: Status updates <2s, balance calculations <2s, forms <5s
- **Security**: No PII in logs, HTTPS, no hardcoded credentials
