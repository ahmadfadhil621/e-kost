---
description: Commit checkpoint workflow and cross-cutting constraints for E-Kost
---

# Commit Checkpoints

After completing a logical unit of work, pause and run the checkpoint workflow before continuing.

## When to Checkpoint

Pause at natural boundaries aligned with the project's architecture layers:

- Domain layer complete (entities, interfaces, schemas)
- Service layer complete (business logic + unit tests)
- API layer complete (routes + repository implementation)
- UI layer complete (components + hooks)
- i18n layer complete (translation keys added)
- Any standalone fix, refactor, or config change

## Checkpoint Workflow

### 1. Summarize Changes

- Run `git diff --stat` to list changed files
- Summarize what was done in 2-3 bullet points
- State the number of files changed and lines added/removed

### 2. Documentation Review

Before committing, review changes and determine if any documentation files need updating.

Docs to consider:

- `README.md` -- "Development Status", "Getting Started", "Project Structure" sections
- `specs/architecture-intent.md`, `specs/data-architecture.md` -- if structural or data model changes were made
- `specs/<feature>/tasks.md` -- if a task was completed that should be marked done
- `specs/<feature>/design.md` -- if a design decision changed during implementation

If docs need updating:

1. List which files need changes and why (1 line per file)
2. Ask the user: "Should I update these documentation files?"
3. If yes -- make the doc updates so they are included in the same commit
4. If no -- proceed without doc changes

If no docs need updating, skip silently (do not ask).

### 3. Propose Commit

After doc updates (if any) are done, generate a commit message following the format below and present it to the user.

**NEVER run `git add`, `git commit`, or any git write commands.** The user will handle all git operations themselves. The agent's role is limited to:

1. Generating the commit message
2. Presenting it to the user
3. Asking: "Would you like to continue to the next task?"

## Commit Message Format

- Line 1: `type(scope): short description` using conventional commit types (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`)
- Line 2: blank
- Lines 3+: bullet list of changes using `- ` prefix, with sub-items using `  * ` prefix
- Final paragraph (optional): additional context explaining the "why" if not obvious

Never include generated or obvious filler text in commit messages.

---

# Cross-Cutting Constraints

These apply to every feature. See `specs/cross-cutting-constraints.md` for full details.

## Mobile-First

- All screens: 320px-480px width, single-column layout, no horizontal scroll
- All interactive elements: minimum 44x44px touch targets
- Font sizes and contrast must be readable without zoom

## i18n

- Never hardcode user-facing strings -- always use translation keys via `useTranslation()`
- Translation files: `locales/en.json`, `locales/id.json`
- All validation messages, errors, confirmations, and labels must be translatable
- Date/number/currency formatting must respect locale
- Currency: EUR by default, stored as a locale-level i18n setting (not hardcoded in components)
- Use `Intl.NumberFormat` with currency code from i18n config, never hardcode `€` or currency symbols

## Data Integrity

- All timestamps in UTC
- Soft delete for tenant move-out (set `deletedAt`, never hard delete)
- Auto-generated immutable UUIDs for all records
- Persist data immediately on create/update

## Accessibility

- Color-coded indicators must also use text or icons (never color alone)
- All form fields must have labels
- All interactive elements must be keyboard-accessible
- WCAG AA color contrast minimum

## Performance

- Status updates reflected within 2 seconds
- Balance calculations within 2 seconds
- Form submissions within 5 seconds
- Lists must stay responsive at 1,000+ records (use pagination)

## Security

- Tenant data (name, phone, email) is PII -- no PII in logs
- All data over HTTPS
- No hardcoded credentials -- use environment variables
