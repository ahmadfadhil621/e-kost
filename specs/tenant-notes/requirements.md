# Requirements: Tenant Notes

## Context & Problem

Property managers frequently need to record informal observations, agreements, reminders, and important details about individual tenants — such as "agreed to fix the broken window by Friday", "prefers to pay on the 5th of each month", or "has a pet cat, approved on 2025-03-01". Without a structured notes system, these details are scattered across personal notebooks, text messages, or memory, leading to lost information, miscommunication with staff, and inability to review a tenant's history on mobile devices while on-site.

## Goals

- Enable managers to create, view, update, and delete notes for individual tenants
- Display notes in chronological order within the tenant detail page
- Support free-text notes with a date for each entry
- Deliver a mobile-optimized note-taking interface accessible from the tenant detail view
- Preserve notes history even after tenant move-out (soft-deleted tenants retain notes)

## Non-Goals

- Rich text editing or formatting (bold, italic, attachments)
- Note categories or tags
- Shared notes visible to tenants
- Note search or full-text search across all tenants
- Note templates or pre-filled entries
- File or image attachments on notes
- Note notifications or reminders

## Glossary

- **TenantNote**: A free-text note associated with a specific tenant, containing content, a date, and timestamps
- **Notes Section**: The UI area within the tenant detail page that displays and manages notes

## Functional Requirements

### Requirement 1: Note Creation

**User Story:** As a property manager, I want to add a note to a tenant's record, so that I can track important observations and agreements.

#### Acceptance Criteria

1. WHEN a manager views a tenant detail page, THE System SHALL display an "Add Note" button or input area in the notes section
2. WHEN a manager accesses the note creation interface, THE System SHALL display a form with fields for note content (text) and date
3. WHEN a manager submits a valid note with content and date, THE System SHALL create a new note record associated with the tenant and display a confirmation message
4. WHEN a manager attempts to submit a note with empty content, THE System SHALL prevent submission and display a validation error
5. WHEN a note is created, THE System SHALL assign a unique identifier, record the creation timestamp in UTC, and persist immediately
6. WHEN a manager creates a note, THE System SHALL default the date field to today's date

### Requirement 2: Note List Display

**User Story:** As a property manager, I want to see all notes for a tenant in chronological order, so that I can review the full history of observations and agreements.

#### Acceptance Criteria

1. WHEN a manager views a tenant detail page, THE System SHALL display a notes section showing all notes for that tenant
2. WHEN a manager views the notes section, THE System SHALL display each note showing content, date, and creation timestamp
3. WHEN a manager views notes, THE System SHALL sort notes by date in descending order (most recent first)
4. WHEN a tenant has no notes, THE System SHALL display an empty state message encouraging the manager to add a note
5. WHEN a manager views notes on a mobile device, THE System SHALL render notes in a single-column layout with clear visual separation between entries

### Requirement 3: Note Update

**User Story:** As a property manager, I want to edit an existing note, so that I can correct mistakes or add details.

#### Acceptance Criteria

1. WHEN a manager views a note, THE System SHALL display an edit option (icon or button)
2. WHEN a manager taps the edit option, THE System SHALL display the note content and date in an editable form
3. WHEN a manager saves updated note content, THE System SHALL persist the changes and display a confirmation message
4. WHEN a manager saves an updated note, THE System SHALL preserve the original creation timestamp and unique identifier
5. WHEN a manager attempts to save a note with empty content, THE System SHALL prevent the save and display a validation error

### Requirement 4: Note Deletion

**User Story:** As a property manager, I want to delete a note that is no longer relevant, so that I can keep the notes section clean and useful.

#### Acceptance Criteria

1. WHEN a manager views a note, THE System SHALL display a delete option (icon or button)
2. WHEN a manager taps the delete option, THE System SHALL display a confirmation dialog to prevent accidental deletion
3. WHEN a manager confirms deletion, THE System SHALL permanently remove the note record from the database
4. WHEN a note is deleted, THE System SHALL update the notes list immediately to reflect the removal
5. WHEN a manager cancels deletion, THE System SHALL leave the note unchanged

### Requirement 5: Notes Persistence Across Tenant Lifecycle

**User Story:** As a property manager, I want tenant notes to be preserved even after a tenant moves out, so that I can reference historical information.

#### Acceptance Criteria

1. WHEN a tenant is moved out (soft-deleted), THE System SHALL preserve all associated notes
2. WHEN a manager views a moved-out tenant's detail page, THE System SHALL still display all notes in the notes section
3. WHEN viewing a moved-out tenant's notes, THE System SHALL allow reading but disable creation of new notes

### Requirement 6: Mobile Optimization

**User Story:** As a property manager using a smartphone, I want the notes interface optimized for mobile use, so that I can quickly add and review notes while on-site.

#### Acceptance Criteria

1. WHEN a manager accesses the notes section on a mobile device, THE System SHALL render all content in a single-column layout with no horizontal scrolling
2. WHEN a manager interacts with note forms on mobile, THE System SHALL display form fields with adequate spacing and minimum 44x44px touch targets
3. WHEN a manager views notes on mobile, THE System SHALL display each note as a full-width card with readable text and clear visual separation
4. WHEN a manager views the notes section on screens smaller than 480px, THE System SHALL maintain readability without requiring pinch-to-zoom
5. WHEN a manager taps edit or delete actions on mobile, THE System SHALL ensure action buttons/icons have minimum 44x44px touch targets

## Constraints

- All note data must be persisted to the database immediately upon creation or modification
- Notes must be scoped to a tenant within a property (propertyId + tenantId)
- Note content must be non-empty and no longer than 2,000 characters
- Note dates must be valid calendar dates
- All timestamps must be recorded in UTC timezone
- Note deletion is a hard delete (notes are simple operational records, not financial data)
- The system must support at least 100 notes per tenant without performance degradation
- The interface must function on mobile devices with screen widths from 320px to 480px
- All user-facing text must be externalized via translation keys (see cross-cutting-constraints.md)
- All form labels, validation messages, and confirmation dialogs must use translation keys

## Success Criteria

- A manager can add a note to a tenant in fewer than 15 seconds
- A manager can view all notes for a tenant in chronological order on a single scrollable mobile screen
- A manager can edit a note and see changes reflected within 2 seconds
- A manager can delete a note with confirmation in fewer than 5 seconds
- Notes are preserved for moved-out tenants
- All interactive elements are accessible via touch on mobile devices without requiring zoom
- No note data is lost during any CRUD operation
