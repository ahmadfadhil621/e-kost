# Property Staff Management — Requirements

**GitHub Issue**: #26
**Status**: In progress

## Overview

Move the StaffSection component from the `/settings` page into the Property Detail page (`/properties/[propertyId]`), scoped per property. Replace the "Coming soon" staff placeholder card on Property Detail with the live StaffSection.

## Functional Requirements

- REQ-1: The Property Detail page (`/properties/[propertyId]`) must render the `StaffSection` component in place of the current "Coming soon" placeholder.
- REQ-2: The `StaffSection` must receive `propertyId`, `propertyName`, and `userRole` from the property data already fetched on the detail page.
- REQ-3: Owners must see the full staff management UI (invite, remove) on the Property Detail page.
- REQ-4: Staff (non-owner) users must NOT see the staff management UI on the Property Detail page (StaffSection returns null for non-owners — existing behavior unchanged).
- REQ-5: The `StaffSection` must be removed from `/settings`.
- REQ-6: Settings page must continue to show Language and Account sections.

## Out of Scope

- Changes to StaffSection or StaffManagement component internals
- i18n key changes
- Schema or API changes
