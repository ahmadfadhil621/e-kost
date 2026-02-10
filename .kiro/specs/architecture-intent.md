# Architecture Intent: E-Kost MVP

## Overview

This document defines the architectural principles for E-Kost to remain resilient through rapid change in AI models, providers, requirements, regulations, and language support. The architecture prioritizes isolation of change, clarity, and avoiding lock-in.

---

## Core Responsibilities

1. **Tenant lifecycle management** – create, update, assign, move-out
2. **Room inventory and status tracking** – available, occupied, renovation
3. **Payment recording and history** – log and retrieve payments
4. **Outstanding balance calculation and display** – rent minus payments
5. **Mobile-responsive user interface** – 320px-480px, 44x44px targets, single-column layouts
6. **Data persistence and integrity** – UTC timestamps, soft deletes, 1,000+ tenant records
7. **Internationalization (i18n)** – language-agnostic UI via JSON translation files

---

## Likely-to-Change Parts

- AI models and providers (not in MVP, but expected future enhancement)
- Mobile UI frameworks and responsive design patterns
- Balance calculation rules (currently simple; may become complex with late fees, pro-rating)
- Validation rules and business logic refinements
- External service integrations (auth, analytics, AI)
- Language support (i18n JSON files can be added/updated without code changes)
- Locale-specific formatting (dates, numbers, currency)

---

## Stable Parts

- Core domain entities (Tenant, Room, Payment, Balance)
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
- **Future: Authentication provider** – managed auth service (not in MVP)
- **Future: AI services** – for automation, insights, validation (not in MVP)
- **Future: Analytics/monitoring** – observability (not in MVP)
- **i18n: Translation files** – JSON files per language (internal, no external dependency)

---

## Architecture Intent Statement

• **Domain Core Isolation**: Separate tenant, room, payment, and balance business logic into a domain layer with clear interfaces, keeping business rules independent of UI frameworks, databases, or external services.

• **Data Access Abstraction**: Use repository pattern with interfaces for tenant, room, and payment data operations, allowing database technology changes without affecting business logic or API contracts.

• **API Boundary Stability**: Maintain stable REST API contracts for mobile client, with internal service implementations that can evolve independently behind consistent interfaces.

• **Mobile UI Decoupling**: Isolate mobile-responsive UI components (320px-480px layouts, 44x44px targets, single-column) from business logic through clean API consumption, enabling framework changes without backend impact.

• **Language-Agnostic i18n**: Externalize all UI text via translation keys stored in JSON files per language; changing a single JSON file changes the entire webapp language without code deployment, supporting unlimited language additions.

• **Future AI Integration Points**: Design calculation and validation services with pluggable interfaces, allowing AI-powered enhancements (automated balance reconciliation, tenant risk scoring) to be added without core system changes.

• **Data Privacy by Design**: Implement tenant data handling with clear boundaries for PII processing; any future AI integrations must access data through controlled interfaces that enforce privacy policies and prevent PII leakage to external services.

• **Calculation Engine Flexibility**: Abstract balance calculation logic behind interfaces, supporting evolution from simple "rent minus payments" to complex rules (late fees, pro-rating, payment plans) without API changes.

---

## Key Architectural Boundaries

### Domain Layer (Stable)
- Tenant, Room, Payment, Balance entities
- Business rules: validation, calculation, state transitions
- No framework dependencies, no database specifics

### Service Layer (Stable Interface, Flexible Implementation)
- TenantService, RoomService, PaymentService, BalanceService
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
- `IPaymentRepository` – data access for payments
- `ITenantRepository` – data access for tenants
- `IRoomRepository` – data access for rooms
- `IBalanceCalculator` – balance calculation logic
- `IValidationService` – validation rules
- `IAIProvider` – future AI service integration (not in MVP)
- `ITranslationProvider` – i18n translation key resolution

**Adapters (Implementations)**:
- PostgreSQL adapter for repositories
- Simple calculator adapter (rent minus payments)
- Email/SMS adapter for notifications (future)
- OpenAI/Claude/other adapter for AI (future)
- Supabase/Firebase adapter for auth (future)
- JSON file adapter for i18n (current MVP)
- Future: Database-backed translation adapter

---

## Open Questions / Assumptions

• **AI Integration Scope**: Requirements contain no AI features, but architecture assumes future AI enhancements for automation, insights, or validation assistance.

• **Authentication Strategy**: No auth requirements in MVP, but architecture assumes future managed auth provider integration.

• **Multi-tenancy**: Current specs assume single property management, but architecture should consider future multi-property expansion.

• **Real-time Requirements**: No real-time collaboration specified, but balance updates "within 2 seconds" suggests near-real-time calculation needs.

• **Audit Trail**: Soft delete for tenants implies audit needs, but no explicit audit log requirements for payments or room changes.

• **Data Residency**: No compliance or data residency requirements specified; future regulations may require data localization.

• **i18n Scope**: Architecture supports unlimited languages via JSON files, but no specific language requirements beyond language-agnostic design.

• **Locale Formatting**: Date, number, and currency formatting must respect locale, but no specific locale list defined beyond language support.

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
