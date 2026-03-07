# Architecture Intent: E-Kost MVP

## Overview

This document defines the architectural principles for E-Kost to remain resilient through rapid change in AI models, providers, requirements, regulations, and language support. The architecture prioritizes isolation of change, clarity, and avoiding lock-in.

---

## Core Responsibilities

1. **Multi-property management** – property CRUD, property switching, staff assignment per property
2. **Tenant lifecycle management** – create, update, assign, move-out (scoped per property)
3. **Room inventory and status tracking** – available, occupied, renovation (scoped per property)
4. **Payment recording and history** – log and retrieve payments
5. **Outstanding balance calculation and display** – rent minus payments
6. **Finance and expense tracking** – monthly income/expense tracking with category breakdown
7. **Tenant notes** – per-tenant notes for observations, agreements, reminders
8. **Dashboard / overview** – occupancy stats, finance summary, recent payments
9. **User authentication and roles** – account creation, login, session management, owner/staff roles
10. **Settings and staff management** – owner can add/remove property staff
11. **Mobile-responsive user interface** – 320px-480px, 44x44px targets, single-column layouts
12. **Data persistence and integrity** – UTC timestamps, soft deletes, 1,000+ tenant records
13. **Internationalization (i18n)** – language-agnostic UI via JSON translation files, locale-configurable currency (EUR default)

---

## Likely-to-Change Parts

- AI models and providers (not in MVP, but expected future enhancement)
- Mobile UI frameworks and responsive design patterns
- Balance calculation rules (currently simple; may become complex with late fees, pro-rating)
- Validation rules and business logic refinements
- Authentication provider configuration and policies
- External service integrations (analytics, AI)
- Language support (i18n JSON files can be added/updated without code changes)
- Locale-specific formatting (dates, numbers, currency)

---

## Stable Parts

- Core domain entities (Property, Tenant, Room, Payment, Expense, TenantNote, Balance)
- Database schema and relationships
- REST API contracts
- UTC timestamp handling
- Mobile-first constraints (320px-480px, 44x44px targets, single-column)
- Soft delete pattern for historical data
- i18n infrastructure (translation key structure, locale switching mechanism)
- Cross-cutting constraints (accessibility, performance, security, validation)

---

## External Interactions

- **Database storage** – PostgreSQL or managed service
- **Authentication provider** – Better Auth for account creation, login, sessions (with Prisma adapter, self-hostable)
- **Future: AI services** – for automation, insights, validation (not in MVP)
- **Future: Analytics/monitoring** – observability (not in MVP)
- **i18n: Translation files** – JSON files per language (internal, no external dependency)

---

## Architecture Intent Statement

• **Domain Core Isolation**: Separate property, tenant, room, payment, expense, note, and balance business logic into a domain layer with clear interfaces, keeping business rules independent of UI frameworks, databases, or external services.

• **Data Access Abstraction**: Use repository pattern with interfaces for property, tenant, room, payment, expense, and note data operations, allowing database technology changes without affecting business logic or API contracts.

• **API Boundary Stability**: Maintain stable REST API contracts for mobile client, with internal service implementations that can evolve independently behind consistent interfaces.

• **Mobile UI Decoupling**: Isolate mobile-responsive UI components (320px-480px layouts, 44x44px targets, single-column) from business logic through clean API consumption, enabling framework changes without backend impact.

• **Language-Agnostic i18n**: Externalize all UI text via translation keys stored in JSON files per language; changing a single JSON file changes the entire webapp language and currency without code deployment, supporting unlimited language additions. Currency is a locale-level setting (EUR default).

• **Future AI Integration Points**: Design calculation and validation services with pluggable interfaces, allowing AI-powered enhancements (automated balance reconciliation, tenant risk scoring) to be added without core system changes.

• **Data Privacy by Design**: Implement tenant data handling with clear boundaries for PII processing; any future AI integrations must access data through controlled interfaces that enforce privacy policies and prevent PII leakage to external services.

• **Calculation Engine Flexibility**: Abstract balance calculation logic behind interfaces, supporting evolution from simple "rent minus payments" to complex rules (late fees, pro-rating, payment plans) without API changes.

---

## Key Architectural Boundaries

### Domain Layer (Stable)
- Property, Tenant, Room, Payment, Expense, TenantNote, Balance entities
- Business rules: validation, calculation, state transitions
- No framework dependencies, no database specifics

### Service Layer (Stable Interface, Flexible Implementation)
- PropertyService, TenantService, RoomService, PaymentService, BalanceService, ExpenseService, FinanceSummaryService, NoteService
- Repository interfaces for data access
- Pluggable implementations for future AI/automation

### API Layer (Stable Contract)
- REST endpoints for mobile client
- Consistent request/response schemas
- Version-stable contracts

### Data Layer (Swappable)
- Repository implementations
- Database abstraction via interfaces
- Migration-friendly schema

### UI Layer (Replaceable)
- Mobile-responsive components
- API client library
- Framework-agnostic business logic consumption

### i18n Layer (Extensible)
- Translation key infrastructure
- JSON file-based language support
- Locale-aware formatting (dates, numbers, currency)

---

## Ports & Adapters Thinking

**Ports (Interfaces)**:
- `IPropertyRepository` – data access for properties
- `IPaymentRepository` – data access for payments
- `ITenantRepository` – data access for tenants
- `IRoomRepository` – data access for rooms
- `IExpenseRepository` – data access for expenses
- `INoteRepository` – data access for tenant notes
- `IBalanceCalculator` – balance calculation logic
- `IValidationService` – validation rules
- `IAIProvider` – future AI service integration (not in MVP)
- `ITranslationProvider` – i18n translation key resolution

**Adapters (Implementations)**:
- PostgreSQL adapter for repositories
- Simple calculator adapter (rent minus payments)
- Email/SMS adapter for notifications (future)
- OpenAI/Claude/other adapter for AI (future)
- Better Auth adapter for authentication (current MVP, with Prisma adapter for database sessions)
- JSON file adapter for i18n (current MVP)
- Future: Database-backed translation adapter

---

## Open Questions / Assumptions

• **AI Integration Scope**: Requirements contain no AI features, but architecture assumes future AI enhancements for automation, insights, or validation assistance.

• **Authentication Strategy**: MVP uses Better Auth with Prisma adapter for account creation, login, and session management. Auth data lives in the same Prisma-managed database as domain data. Service-layer authorization and multi-user collaboration are post-MVP considerations.

• **Multi-property**: MVP supports multiple properties per user. Each property has its own rooms, tenants, payments, expenses, and staff. Data is scoped per property via `propertyId` foreign keys.

• **Real-time Requirements**: No real-time collaboration specified, but balance updates "within 2 seconds" suggests near-real-time calculation needs.

• **Audit Trail**: Soft delete for tenants implies audit needs, but no explicit audit log requirements for payments or room changes.

• **Data Residency**: No compliance or data residency requirements specified; future regulations may require data localization.

• **i18n Scope**: Architecture supports unlimited languages via JSON files. Default language is English. Currency is a locale-level setting (EUR default) configurable per locale JSON file.

• **Locale Formatting**: Date, number, and currency formatting must respect locale. Currency code is sourced from the active locale's i18n config, not hardcoded in components.

---

## Implementation Guidance

1. Start with domain layer: define entities, business rules, interfaces
2. Implement repositories with clear interfaces (not tied to ORM)
3. Build services that depend on interfaces, not implementations
4. Expose stable REST API that doesn't leak internal structure
5. Keep UI layer thin—consume API, don't duplicate business logic
6. Plan for AI integration points in balance calculation and validation services
7. Document data flows for PII handling (tenant names, contact info)
8. Implement i18n infrastructure early: translation keys in all UI components
9. Design locale-aware formatting for dates, numbers, currency
10. Ensure translation JSON files can be updated without code deployment
