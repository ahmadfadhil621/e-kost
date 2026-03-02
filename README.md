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
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, Lucide React |
| Forms & Validation | React Hook Form, Zod |
| Backend | Next.js API Routes (Vercel serverless) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Authentication | Better Auth (Prisma adapter) |
| i18n | react-i18next |
| Hosting | Vercel + Supabase free tiers ($0/month) |

See `specs/technology-stack-decisions.md` for the full evaluation and rationale.

## Project Structure

```
specs/
├── tenant-room-basics/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── room-inventory-management/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── payment-recording/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── outstanding-balance/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── user-authentication/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── multi-property/           (specs pending)
├── dashboard-overview/       (specs pending)
├── finance-expense/          (specs pending)
├── tenant-notes/             (specs pending)
├── settings-staff/           (specs pending)
├── architecture-intent.md
├── cross-cutting-constraints.md
├── data-architecture.md
├── technology-decisions.md
├── technology-stack-decisions.md
└── scalability-stress-analysis.md
```

Each feature directory contains requirements, design, and task documents. Directories marked "(specs pending)" are new MVP features that need formal specification. Cross-cutting specs cover architecture, data modeling, technology choices, and scalability analysis.

## Getting Started

Prerequisites:

- Node.js 18+
- A PostgreSQL database (Supabase free tier, or any self-hosted Postgres)
- Review the specs in `specs/` to understand feature requirements and architecture decisions

Setup steps will be added once implementation begins.

## Development Status

**Current phase:** Specs and architecture complete, implementation pending.

Known limitations:

- Mobile-first design targets smartphone screens (320px–480px width)
- Manual payment entry only (no automated processing)
- Basic balance calculation (expected rent minus payments, no late fees or payment plans)
- Currency: EUR by default, configurable per locale via i18n (no multi-currency within a single property)

## Contributing

This project follows a spec-driven development approach. All features are documented in `specs/` with formal requirements, design documents, and task breakdowns. Review the relevant spec before implementing or suggesting changes to ensure alignment with MVP goals.
