# Data Architecture: E-Kost MVP

## Overview

This document defines the minimal data storage architecture for E-Kost MVP, focusing only on what's needed to deliver the core functionality.

---

## Data Architecture Table

| Data Domain | Data Type | Storage Architecture | Reason for Choice |
|------------|----------|----------------------|------------------|
| Properties | Transactional | Relational database | Multi-property support, ownership and staff assignment, parent entity for rooms/tenants/expenses |
| Tenants | Transactional | Relational database | CRUD operations with referential integrity to rooms and payments, structured personal data with consistent schema |
| Rooms | Transactional | Relational database | Simple inventory management with status updates, foreign key relationships to tenants and properties |
| Payments | Transactional | Relational database | Financial records requiring ACID compliance, foreign key to tenants, audit trail for monetary transactions |
| Expenses | Transactional | Relational database | Property-level expense records with category, amount, date; used for finance/income tracking |
| Tenant Notes | Transactional | Relational database | Per-tenant notes for observations, agreements, reminders; foreign key to tenants |
| Outstanding Balances | Analytical | Relational database (computed) | Derived calculations from payments and room rent, real-time computation requirements, no separate storage needed |
| Translation Content | Transactional | JSON files | Key-value pairs for i18n (including currency config), infrequent updates, simple file-based approach sufficient for MVP |

---

## MVP Data Domains

### 1. Properties (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Name, address
- Owner (foreign key to user)
- Staff list (many-to-many with users)
- Creation timestamp (UTC)
- Soft delete (deletedAt) for property deletion

**Why Relational**: Parent entity for rooms, tenants, expenses. Ownership and staff relationships require referential integrity. Multi-property queries need JOIN support.

---

### 2. Tenants (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Name, phone number, email (PII)
- Property (foreign key)
- Room assignment (foreign key)
- Creation timestamp (UTC)
- Soft delete flag (move-out tracking)

**Why Relational**: Strong consistency required for referential integrity with rooms and payments.

---

### 3. Rooms (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Property (foreign key)
- Room number/identifier (unique within property)
- Room type
- Monthly rent amount
- Status (available, occupied, under renovation)
- Creation timestamp (UTC)

**Why Relational**: Strong consistency required for status updates and tenant assignment validation. Scoped per property.

---

### 4. Payments (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Tenant ID (foreign key)
- Payment amount (positive decimal)
- Payment date
- Recording timestamp (UTC)

**Why Relational**: ACID compliance essential for financial accuracy.

---

### 5. Expenses (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Property (foreign key)
- Date
- Category (Electricity, Water, Internet, Maintenance, Cleaning, Supplies, Tax, Transfer, Other)
- Description
- Amount (positive decimal)
- Recording timestamp (UTC)

**Why Relational**: Financial records requiring ACID compliance. Scoped per property. Supports monthly income/expense reports with category aggregation.

---

### 6. Tenant Notes (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Tenant ID (foreign key)
- Date
- Text content
- Recording timestamp (UTC)

**Why Relational**: Foreign key to tenants ensures referential integrity. Simple CRUD with chronological ordering.

---

### 7. Outstanding Balances (Analytical - Computed)

**Calculation**: Expected rent - Total payments

**Implementation**: Computed on-demand from existing tables via SQL query or application logic. No separate storage needed.

**Why Computed**: Real-time calculation within 2 seconds required; derived from existing data.

---

### 8. Translation Content (JSON Files)

**Implementation**: 
- `locales/en.json`, `locales/id.json`, etc.
- Static files loaded at application startup
- Changed by updating files, not database

**Why JSON Files**: Simple, no database overhead, matches cross-cutting constraints requirement for single JSON file per language.

---

## What We're NOT Building (YAGNI Applied)

### User Sessions
**Decision**: Store in database via Better Auth's Prisma adapter (server-side sessions)
**Rationale**: Better Auth manages session records in the same Prisma-managed database as domain data. Database sessions enable server-side revocation and avoid JWT-only limitations. Session table is part of the Prisma schema alongside Tenant, Room, Payment tables.

### Application Logs  
**Decision**: Use standard application logging to files or console
**Rationale**: No audit requirements in MVP specs, standard logging sufficient for debugging

### Complex Analytics
**Decision**: Simple SQL queries on existing tables
**Rationale**: Dashboard overview and finance tracking use simple aggregation queries, no OLAP or BI tooling needed

### Caching Layer
**Decision**: Not needed for MVP scale
**Rationale**: 1,000 tenants, 500 rooms, 10,000 payments - database can handle directly

---

## Technology Recommendation

**Database**: PostgreSQL (managed service like Supabase)
- Handles all transactional data
- JSON support for flexible fields if needed
- Strong consistency and ACID compliance
- Scales beyond MVP requirements

**Translation Files**: Static JSON files in `locales/` directory
- Matches existing cross-cutting constraints
- No additional infrastructure needed
- Easy to update without deployment

**Sessions**: Database-stored via Better Auth's Prisma adapter
- Server-side session records in the `session` table alongside domain data
- HTTP-only cookies for session tokens (secure, not accessible to JavaScript)
- Enables server-side session revocation and 30-day expiry
