# Requirements — RT-4: Remove Redundant Back Button

**Issue:** #19
**Label:** ux, priority: medium, rooms

## Problem

Back buttons on three detail pages (Room, Tenant, Expense) are redundant. The browser and mobile OS already provide back navigation. The buttons consume vertical space and add visual noise without providing value.

## Goal

Remove all `common.back` Back buttons from the three affected detail page files.

## Non-Goals

- Do not add any replacement navigation chrome
- Do not touch the bottom nav
- Do not remove `router` imports (still used by mutation callbacks)
- Do not add new i18n keys
- Do not remove the `common.back` i18n key (used elsewhere)

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-1 | The Room Detail error state must not render a Back button |
| REQ-2 | The Tenant Detail error state must not render a Back button |
| REQ-3 | The Tenant Detail moved-out state must not render a Back button |
| REQ-4 | The Tenant Detail normal (active) state must not render a Back button |
| REQ-5 | The Expense Detail error state must not render a Back button |
| REQ-6 | The Expense Detail normal view must not render a Back button |
| REQ-7 | All remaining interactive elements on each page must retain minimum 44×44px touch targets |
| REQ-8 | No horizontal scroll at 320–480px viewport width |
| REQ-9 | The `common.back` i18n key must be preserved |
| REQ-10 | Keyboard and screen reader navigation must not be degraded: bottom nav tabs remain as the primary navigation affordance |
