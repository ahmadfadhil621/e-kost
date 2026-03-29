# Property Archive & Delete — Requirements
<!-- Traceability: issue #27 -->

## Background
Consistent with RT-9 (room archive/delete), properties support two distinct removal actions so owners can safely hide unused properties or permanently remove them.

## Acceptance Criteria

### Archive (soft delete)
- AC-1: Owner can archive a property that has no active tenants (all tenants have `movedOutAt` set).
- AC-2: Archived property is hidden from the default property list.
- AC-3: Archived property can be unarchived (restored) by the owner.
- AC-4: Attempting to archive a property with at least one active tenant returns a 409 error.
- AC-5: Attempting to archive an already-archived property returns a 409 error.
- AC-6: Staff cannot archive a property (403 forbidden).

### Delete (hard delete)
- AC-7: Owner can permanently delete a property that has no active tenants.
- AC-8: Delete cascades to all related records: rooms, tenants, expenses, payments, invite tokens, staff assignments.
- AC-9: Delete requires the owner to type the exact property name in a confirmation dialog before the action proceeds.
- AC-10: Attempting to delete a property with at least one active tenant returns a 409 error.
- AC-11: Staff cannot delete a property (403 forbidden).

### G-3 — Dangerous Actions at Bottom
- AC-12: Archive and Delete buttons appear in a clearly labelled "Danger Zone" section at the bottom of the property detail page.
- AC-13: When a property has active tenants, both buttons are disabled with a contextual warning message.

### Post-Action Behaviour
- AC-14: After successful archive or delete, the user is redirected to `/properties`.
- AC-15: A toast notification confirms success.
