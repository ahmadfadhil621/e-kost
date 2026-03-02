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
│   ├── api/                 # API routes
│   ├── globals.css          # Design tokens (CSS variables)
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── layout/              # App shell, header, nav
├── domain/
│   ├── schemas/             # Shared Zod schemas
│   └── interfaces/          # Repository interfaces
├── services/                # Business logic services
├── repositories/            # Prisma implementations
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities (prisma, i18n, auth, etc.)
│   └── utils.ts
└── test/                    # Test setup and helpers
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

## Development Status

**Current phase:** Phase 0 (Project Foundation) complete. App shell, design tokens, i18n, Prisma schema, and test config ready.

Known limitations:

- Mobile-first design targets smartphone screens (320px–480px width)
- Manual payment entry only (no automated processing)
- Basic balance calculation (expected rent minus payments, no late fees or payment plans)
- Currency: EUR by default, configurable per locale via i18n (no multi-currency within a single property)

## Contributing

This project follows a spec-driven development approach. All features are documented in `specs/` with formal requirements, design documents, and task breakdowns. Review the relevant spec before implementing or suggesting changes to ensure alignment with MVP goals.
