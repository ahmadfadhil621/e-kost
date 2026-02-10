# Data Architecture: E-Kost MVP

## Overview

This document defines the minimal data storage architecture for E-Kost MVP, focusing only on what's needed to deliver the core functionality.

---

## Data Architecture Table

| Data Domain | Data Type | Storage Architecture | Reason for Choice |
|------------|----------|----------------------|------------------|
| Tenants | Transactional | Relational database | CRUD operations with referential integrity to rooms and payments, structured personal data with consistent schema |
| Rooms | Transactional | Relational database | Simple inventory management with status updates, foreign key relationships to tenants, structured attributes |
| Payments | Transactional | Relational database | Financial records requiring ACID compliance, foreign key to tenants, audit trail for monetary transactions |
| Outstanding Balances | Analytical | Relational database (computed) | Derived calculations from payments and room rent, real-time computation requirements, no separate storage needed |
| Translation Content | Transactional | JSON files | Key-value pairs for i18n, infrequent updates, simple file-based approach sufficient for MVP |

---

## MVP Data Domains

### 1. Tenants (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Name, phone number, email (PII)
- Room assignment (foreign key)
- Creation timestamp (UTC)
- Soft delete flag (move-out tracking)

**Why Relational**: Strong consistency required for referential integrity with rooms and payments.

---

### 2. Rooms (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Room number/identifier (unique within property)
- Room type
- Monthly rent amount
- Status (available, occupied, under renovation)
- Creation timestamp (UTC)

**Why Relational**: Strong consistency required for status updates and tenant assignment validation.

---

### 3. Payments (Transactional - Relational)

**Key Attributes**:
- Unique identifier (immutable)
- Tenant ID (foreign key)
- Payment amount (positive decimal)
- Payment date
- Recording timestamp (UTC)

**Why Relational**: ACID compliance essential for financial accuracy.

---

### 4. Outstanding Balances (Analytical - Computed)

**Calculation**: Expected rent - Total payments

**Implementation**: Computed on-demand from existing tables via SQL query or application logic. No separate storage needed.

**Why Computed**: Real-time calculation within 2 seconds required; derived from existing data.

---

### 5. Translation Content (JSON Files)

**Implementation**: 
- `locales/en.json`, `locales/id.json`, etc.
- Static files loaded at application startup
- Changed by updating files, not database

**Why JSON Files**: Simple, no database overhead, matches cross-cutting constraints requirement for single JSON file per language.

---

## What We're NOT Building (YAGNI Applied)

### User Sessions
**Decision**: Store in browser localStorage/sessionStorage
**Rationale**: No authentication in MVP, no server-side session requirements, browser handles cleanup automatically

### Application Logs  
**Decision**: Use standard application logging to files or console
**Rationale**: No audit requirements in MVP specs, standard logging sufficient for debugging

### Complex Analytics
**Decision**: Simple SQL queries on existing tables
**Rationale**: No analytics requirements in MVP, basic reporting can use existing data

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

**Sessions**: Browser storage (localStorage for persistence, sessionStorage for temporary)
- No server-side storage needed
- Automatic cleanup on browser close
- No authentication requirements in MVP
