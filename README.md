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
- **Settings** — Staff management (owner can add/remove staff), user preferences

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
│   ├── api/                 # API routes (auth, properties, properties/[id]/rooms, tenants, payments, expenses, finance/summary, …)
│   ├── globals.css          # Design tokens (CSS variables)
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Auth-related components
│   ├── property/            # Property CRUD, switcher
│   ├── room/                # Room form, status indicator
│   ├── rooms/               # Room list, filter, cards
│   ├── tenant/              # Tenant form, assign room, move-out
│   ├── payment/             # Payment form, list, per-tenant section
│   ├── balance/             # Balance section, status indicator (tenant detail & list)
│   ├── expense/             # Expense form, list
│   ├── finance/             # Month selector, summary cards, category breakdown
│   ├── notes/               # Note form, note card, notes section (tenant detail)
│   ├── layout/              # App shell, header, nav
│   └── providers/           # React providers (e.g. query client)
├── contexts/                # React context (e.g. property-context for active property)
├── domain/
│   ├── schemas/             # Shared Zod schemas (property, room, tenant, payment, expense, auth)
│   └── interfaces/          # Repository interfaces (property, room, tenant, payment, expense, note)
├── lib/                     # Services (property, room, tenant, payment, balance, expense, finance-summary, note), repositories (Prisma + stubs), auth, prisma, i18n
├── generated/               # Prisma client output (do not edit)
├── hooks/                   # Custom React hooks
└── test/                    # Test setup, fixtures, faults (fault injection), mocks (MSW when used)
e2e/                         # Playwright E2E specs (auth, multi-property-management, room-inventory-management, tenant-room-basics, payment-recording, outstanding-balance, finance-expense-tracking, tenant-notes)
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

**Completed:** Phase 0 (Foundation), Phase 1 (User Authentication), Phase 2 (Multi-Property Management), Phase 3 (Room Inventory), Phase 4 (Tenant & Room Basics), Phase 5 (Payment Recording), Phase 6 (Outstanding Balance), Phase 6a (Tenant Notes), Phase 8 (Finance & Expense Tracking). Outstanding Balance includes BalanceService, balance API routes (single tenant and batch), BalanceSection/BalanceStatusIndicator, balance on tenant list and detail, balance i18n (en + id), and E2E specs in `e2e/outstanding-balance/` (view-tenant-balance, view-tenant-list-balances). Room inventory includes PrismaRoomRepository, room CRUD API routes, RoomList/RoomCard/RoomDetail/StatusFilter/RoomForm/StatusIndicator, and i18n (en + id). Tenant & Room Basics includes TenantService, PrismaTenantRepository, tenant CRUD and assign-room/move-out API routes, TenantForm/TenantList/TenantDetail, assign-room and move-out flows, tenant i18n (en + id), and E2E specs (create-tenant, assign-room, move-out). Payment Recording includes PaymentService, PrismaPaymentRepository, payment CRUD API routes, PaymentForm/PaymentList/TenantPaymentSection, payment i18n (en + id), and E2E specs in `e2e/payment-recording/` (record-payment, view-payment-list, view-tenant-payments). Tenant Notes includes NoteService, PrismaNoteRepository, note CRUD API routes, NotesSection/NoteCard/NoteForm in tenant detail (and moved-out read-only), notes i18n (en + id), and E2E specs in `e2e/tenant-notes/` (create-note, view-notes, edit-note, delete-note, moved-out-tenant-notes). Finance & Expense Tracking includes ExpenseService, FinanceSummaryService, PrismaExpenseRepository, expense CRUD and finance summary API routes, finance overview and expense list/new/edit UI, finance i18n (en + id), and E2E specs in `e2e/finance-expense-tracking/` (view-monthly-summary, add-expense, list-expenses). Dashboard (app root) includes quick links to Rooms and Tenants. Full Vitest and Playwright suites pass in CI. Optional manual checks (workflow, filtering, mobile, performance) are listed in `specs/room-inventory-management/tasks.md` (section 7).

Known limitations:

- Mobile-first design targets smartphone screens (320px–480px width)
- Manual payment entry only (no automated processing)
- Basic balance calculation (expected rent minus payments, no late fees or payment plans)
- Currency: EUR by default, configurable per locale via i18n (no multi-currency within a single property)

## Pre-Deployment Checklist

Before deploying to production, address these items:

- [ ] **Supabase RLS** — Enable Row Level Security on all tables and add a "deny all" policy (since the app uses Prisma, not the Supabase REST API), or disable the PostgREST API entirely in Supabase dashboard (Project Settings → API)
- [ ] **Environment variables** — Ensure `BETTER_AUTH_SECRET` is a unique, securely generated value (not the development one)
- [ ] **HTTPS** — Verify all traffic is served over HTTPS (Vercel handles this by default)

## Contributing

This project follows a spec-driven development approach. All features are documented in `specs/` with formal requirements, design documents, and task breakdowns. Review the relevant spec before implementing or suggesting changes to ensure alignment with MVP goals.
