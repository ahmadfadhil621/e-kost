# E-Kost

## Overview

E-Kost is a simple web application that helps small, informal landlords manage rental rooms. It provides a clear, shared overview of tenants, payments, and room availability. The name comes from the Indonesian word for rental rooms and is inspired by real-world property management challenges faced by small landlords.

The application solves the problem of scattered information across spreadsheets, notes, and messages by providing a single, mobile-optimized system for tracking who lives where, which rooms are available, and who has paid rent.

## MVP Scope

The MVP includes four core features:

- Tenant & Room Basics: Add, view, update, and remove tenants with room assignments
- Room Inventory Management: Create and manage rooms with status tracking (available, occupied, under renovation)
- Payment Recording: Log rent payments with tenant, amount, and date
- Outstanding Balance Tracking: Calculate and display what each tenant owes based on rent and payments

## Tech Stack

To be determined based on implementation requirements. The application must support:

- Mobile-responsive web interface (320px to 480px screen widths)
- Database persistence for tenants, rooms, and payments
- Single-column layouts optimized for smartphone use
- Touch-friendly interactions (minimum 44x44 pixel touch targets)

## Project Structure

```
.kiro/specs/
├── tenant-room-basics/
│   └── requirements.md
├── room-inventory-management/
│   └── requirements.md
├── payment-recording/
│   └── requirements.md
└── outstanding-balance/
    └── requirements.md
```

Each spec directory contains formal requirements documents with acceptance criteria, constraints, and success metrics.

## Getting Started

Prerequisites:

- Review the requirements documents in `.kiro/specs/` to understand feature specifications
- Ensure development environment supports mobile-responsive web development
- Database system for persistent storage

Basic setup steps will be added once the tech stack is finalized.

## Development Status

Current phase: MVP requirements complete, implementation pending

Known limitations:

- Mobile-first design prioritizes smartphone screens (320px-480px width)
- Single-tenant system (no multi-property support)
- Manual payment entry only (no automated processing)
- Basic balance calculation (expected rent minus payments, no late fees or payment plans)
- No historical reporting or analytics

## Contributing

This project follows a spec-driven development approach. All features are documented in `.kiro/specs/` with formal requirements and acceptance criteria. Review the relevant spec before implementing or suggesting changes to ensure alignment with MVP goals.
