# Technology Decisions: E-Kost MVP

## Decision Framework

**Build** – Custom-built in-house. Core to product differentiation, tightly coupled to business logic, requires full control.

**Assemble** – Composed from existing frameworks, libraries, or managed services. Standard functionality that doesn't differentiate, well-solved problems.

**Orchestrate** – Coordinated via APIs, tools, or workflows with minimal internal logic. Commodity functionality, low change frequency, external expertise preferred.

---

## Decision Table

| Component | Decision | Justification |
|-----------|----------|---------------|
| Marketing website / landing page | Orchestrate | Not in MVP scope; if needed, use static site generator or no-code tool—no differentiation value |
| User authentication | Orchestrate | MVP feature—use Supabase Auth (managed service) for account creation, login, session management, and profile display |
| Core business logic (tenant/room/payment/balance) | Build | Core differentiation—custom CRUD workflows, mobile-first UX, and balance calculation logic are product-specific (all 4 requirements docs) |
| Mobile-responsive UI | Assemble | Use responsive CSS framework (Tailwind, Bootstrap) for 320px-480px layouts, 44x44px touch targets—standard mobile patterns (Requirement 6 in all specs) |
| Data storage (tenants, rooms, payments) | Assemble | Use managed database (PostgreSQL on managed service, Supabase, PlanetScale)—standard relational data with UTC timestamps (Constraints in all specs) |
| Internal admin dashboard | Build | Not in MVP scope; if needed, build minimal view using same mobile-first UI—no separate admin requirements |
| Analytics & tracking | Orchestrate | Not in requirements; if needed, use Google Analytics or Plausible—no custom analytics logic required |
| Prototyping & experiments | Assemble | Use existing dev tools (Vite, Next.js) for fast iteration—MVP focus requires speed (README.md: Development Status) |
| Integrations with external tools | Orchestrate | Explicitly out of scope—no banking, accounting, or external system integration in Non-Goals (all specs) |
| Notifications (email, push, etc.) | Orchestrate | Explicitly out of scope—no payment reminders or notifications in Non-Goals (Payment Recording, Outstanding Balance specs) |
| Form validation | Assemble | Use validation library (Zod, Yup)—standard validation patterns for email, positive numbers, required fields (all specs) |
| Date handling | Assemble | Use date library (date-fns, Day.js) for UTC timezone handling—standard requirement across all specs (Constraints) |
| API layer | Build | Custom REST/GraphQL endpoints for tenant, room, payment, balance operations—product-specific business rules (all task files) |
| Mobile UI components | Assemble | Use component library (Radix UI, shadcn/ui) with mobile-first customization—standard patterns with product-specific layouts |

---

## Assumptions / Open Questions

**Tech Stack Not Specified**: Requirements state "Tech stack: TBD" (README.md). Decisions above assume modern web stack (React/Vue/Svelte + Node.js/Python + SQL database) but framework choice doesn't affect Build/Assemble/Orchestrate logic.

**Authentication in MVP**: Authentication is an MVP feature, Orchestrated via Supabase Auth (managed service). Not differentiating—standard email/password auth with session management.

**Single Property Assumption**: Non-Goals explicitly exclude "Multi-property management" (Tenant & Room Basics). This simplifies data model—no need for complex multi-tenancy architecture.

**No Payment Processing**: Non-Goals exclude "Automated payment processing or online payment collection" (Payment Recording). Manual entry only—no Stripe/payment gateway integration needed.

**Mobile-Only Focus**: All specs emphasize 320px-480px mobile screens with 44x44px touch targets. Desktop optimization not required—can Assemble mobile-first framework and skip responsive breakpoints beyond mobile.

**Simple Balance Logic**: Outstanding Balance uses "expected rent minus total payments" with no late fees, payment plans, or pro-rating (Non-Goals). This is Build territory but simple enough to not require external calculation engine.

**No Real-Time Collaboration**: No requirements for multiple managers editing simultaneously or conflict resolution. Can use simple optimistic updates—no need for operational transformation or CRDT libraries.

**Soft Delete Pattern**: Tenant move-out uses soft delete to preserve historical data (Tenant & Room Basics, Requirement 5). This is standard database pattern—Assemble via ORM features, not custom Build.

---

## Key Insights from Requirements

1. **Mobile-first is non-negotiable**: Every spec has mobile responsiveness as Requirement 6 with specific constraints (320px-480px, 44x44px targets, single-column). This drives Assemble decision for mobile UI framework.

2. **No external integrations**: All specs explicitly exclude banking, accounting, external systems in Non-Goals. This eliminates entire Orchestrate category for business integrations.

3. **Simple data model**: Tenants, rooms, payments, balances with straightforward relationships. No complex domain logic requiring DDD frameworks—Build with standard CRUD + custom business rules.

4. **Performance requirements are modest**: 500 rooms, 1,000 tenants, 10,000 payments (Constraints). Managed database can handle this—no need to Build custom data layer or caching.

5. **UTC timestamps everywhere**: Consistent constraint across all specs. Assemble via date library, not Build custom timezone handling.

6. **Validation is standard**: Email format, positive numbers, required fields, unique constraints. Assemble via validation library, not Build custom validators.

---

## Build vs Assemble Boundary

**Build**: Tenant CRUD workflows, room assignment logic, payment recording flow, outstanding balance calculation, mobile-optimized card layouts, status indicators (color-coded paid/unpaid), filtering by room status.

**Assemble**: Database ORM, form validation, date/time handling, responsive CSS framework, UI component primitives, API routing framework, mobile-first component library.

**Orchestrate**: Authentication (Supabase Auth), analytics (if added), email notifications (if added), payment processing (explicitly excluded).

The line is drawn at: **product-specific business logic and UX = Build**, **well-solved technical problems = Assemble**, **commodity services = Orchestrate**.
