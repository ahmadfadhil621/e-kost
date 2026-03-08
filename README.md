# E-Kost

## Overview

E-Kost is a mobile-first web application that helps small, informal landlords manage rental rooms. It provides a clear, shared overview of tenants, payments, and room availability. The name comes from the Indonesian word for rental rooms and is inspired by real-world property management challenges faced by small landlords.

The application solves the problem of scattered information across spreadsheets, notes, and messages by providing a single, mobile-optimized system for tracking who lives where, which rooms are available, and who has paid rent.

## MVP Scope

The MVP includes ten features:

- **User Authentication** — Account creation, login, session management, profile display, owner/staff roles via Better Auth
- **Multi-Property Management** — Property CRUD, property switcher, staff assignment per property
- **Room Inventory Management** — Create and manage rooms with status tracking (available, occupied, under renovation), scoped per property
- **Tenant & Room Basics** — Add, view, update, and remove tenants with room assignments
- **Payment Recording** — Log rent payments with tenant, amount, and date
- **Outstanding Balance Tracking** — Calculate and display what each tenant owes based on rent and payments
- **Dashboard / Overview** — Occupancy statistics, finance summary, outstanding balances list, recent payments
- **Finance & Expense Tracking** — Monthly income/expense tracker with category breakdown, expense CRUD
- **Tenant Notes** — Per-tenant notes for recording observations, agreements, or reminders
- **Settings** — Language switcher (from `locales/*.json`), staff management (owner can add/remove staff), user preferences

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React 18, Tailwind CSS, shadcn/ui, Lucide React |
| Forms & Validation | React Hook Form, Zod |
| Backend | Next.js API Routes (App Router, Vercel serverless) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Authentication | Better Auth (Prisma adapter) |
| i18n | react-i18next |
| Hosting | Vercel + Supabase free tiers ($0/month) |

See `specs/technology-stack-decisions.md` for the full evaluation and rationale.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (login, register) — no header/nav
│   ├── (app)/               # Authenticated pages — with header/nav
│   ├── api/                 # API routes (auth, properties, properties/[id]/rooms, dashboard, tenants, payments, expenses, finance/summary, …)
│   ├── globals.css          # Design tokens (CSS variables)
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Auth-related components
│   ├── property/            # Property CRUD, switcher
│   ├── dashboard/           # OccupancyCard, FinanceSummaryCard, OutstandingBalancesList, RecentPaymentsList
│   ├── room/                # Room form, list, filter, cards, status indicator
│   ├── tenant/              # Tenant form, assign room, move-out
│   ├── payment/             # Payment form, list, per-tenant section
│   ├── balance/             # Balance section, status indicator (tenant detail & list)
│   ├── expense/             # Expense form, list
│   ├── finance/             # Month selector, summary cards, category breakdown
│   ├── notes/               # Note form, note card, notes section (tenant detail)
│   ├── settings/            # Settings page, language selector, account section, staff section
│   ├── layout/              # App shell, header, nav
│   └── providers/           # React providers (e.g. query client)
├── contexts/                # React context (e.g. property-context for active property)
├── domain/
│   ├── schemas/             # Shared Zod schemas (property, room, tenant, payment, expense, auth, dashboard, tenant-note)
│   └── interfaces/          # Repository interfaces (property, room, tenant, payment, expense, note)
├── lib/                     # Services (property, room, tenant, payment, balance, expense, finance-summary, dashboard, note), repositories (Prisma + stubs), auth, prisma, i18n
├── generated/               # Prisma client output (do not edit)
├── hooks/                   # Custom React hooks
└── test/                    # Test setup, fixtures, faults (fault injection), mocks (MSW when used)
e2e/                         # Playwright E2E specs (auth, multi-property-management, room-inventory-management, tenant-room-basics, payment-recording, outstanding-balance, dashboard-overview, finance-expense-tracking, tenant-notes, settings-staff-management)
locales/
├── en.json                  # English translations
└── id.json                  # Indonesian translations
prisma/
└── schema.prisma            # Database schema
specs/                       # Feature specs (requirements, design, tasks)
```

## Getting Started

Prerequisites:

- Node.js 18+
- A PostgreSQL database (Supabase free tier, or any self-hosted Postgres)
- Review the specs in `specs/` to understand feature requirements and architecture decisions

Setup:

1. Copy `.env.example` to `.env` and fill in your Supabase `DATABASE_URL` and `BETTER_AUTH_SECRET`
2. Run `npm install`
3. Run `npx prisma db push` to sync the schema with your database
4. Run `npm run dev` to start the development server

**E2E tests and Playwright MCP (Cursor):** Install browser binaries once with `npx playwright install chromium`. Required for `npm run test:e2e` and for the Playwright MCP server (browser automation in Cursor).

## CI (GitHub Actions)

On every push and pull request to `main`, the **CI** workflow (`.github/workflows/ci.yml`) runs:

1. **Lint** — `npm run lint`
2. **Build** — `npm run build` (with Prisma client generated and schema synced via `prisma db push`)
3. **Unit and integration tests** — `npm run test:run` (Vitest)
4. **E2E tests** — `npm run test:e2e` (Playwright; Chromium only)

CI uses a PostgreSQL 16 service container and sets `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` in the workflow. No GitHub secrets are required for this default setup. To use your own Supabase database in CI instead, add `DATABASE_URL` (and optionally `BETTER_AUTH_SECRET`) as repository secrets and reference them in the workflow.

## Development Status

### Completed (Phases 0–8)

| Phase | Feature | Summary |
|-------|---------|---------|
| 0 | **Project Foundation** | Next.js, Prisma, shadcn/ui, design tokens, i18n, Vitest, mobile app shell |
| 1 | **User Authentication** | Better Auth, register/login, session, protected routes, profile |
| 2 | **Multi-Property Management** | Property CRUD, property switcher, staff assignment, property-scoped access |
| 3 | **Room Inventory** | Room CRUD, status (available / occupied / renovation), list/detail/forms, filters |
| 4 | **Tenant & Room Basics** | Tenant CRUD, room assignment, move-out (soft delete), list/detail/forms |
| 5 | **Payment Recording** | Record and list payments, per-tenant view, currency formatting |
| 6a | **Tenant Notes** | Per-tenant notes CRUD, notes section in tenant detail |
| 6b | **Outstanding Balance** | Balance per tenant (rent − payments), balance in list and detail, status indicators |
| 6c | **Finance & Expense Tracking** | Expense CRUD, monthly income/expense summary, category breakdown |
| 7 | **Dashboard / Overview** | Occupancy stats, finance summary card, outstanding balances list, recent payments, app root as dashboard |
| 8 | **Settings & Staff** | Settings page at /settings, language switcher (from `locales/*.json`), account section (name edit), staff invite/remove (owner-only), bottom nav entry |

All of the above include full stack (domain, services, API, UI), i18n (en + id), and E2E tests where specified. Full Vitest and Playwright suites pass in CI.

### Known Limitations

- Mobile-first design targets smartphone screens (320px–480px width).
- Manual payment entry only (no automated processing).
- Balance is rent minus payments (no late fees or payment plans).
- Currency: EUR by default, configurable per locale via i18n (no multi-currency per property).

## Pre-Deployment Checklist

Before deploying to production, address these items:

- [ ] **Supabase RLS** — Enable Row Level Security on all tables and add a "deny all" policy (since the app uses Prisma, not the Supabase REST API), or disable the PostgREST API entirely in Supabase dashboard (Project Settings → API)
- [ ] **Environment variables** — Ensure `BETTER_AUTH_SECRET` is a unique, securely generated value (not the development one)
- [ ] **HTTPS** — Verify all traffic is served over HTTPS (Vercel handles this by default)

## Contributing

This project follows a spec-driven development approach. All features are documented in `specs/` with formal requirements, design documents, and task breakdowns. Review the relevant spec before implementing or suggesting changes to ensure alignment with MVP goals.
