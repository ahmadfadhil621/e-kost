# Development Workflow

This document describes how to develop features and changes in E-Kost: spec-driven, test-first (TDD), with quality gates and incremental commits.

## Overview

1. **Spec-first** — Every feature has requirements, design, and tasks in `specs/<feature>/`. Read them before coding.
2. **Test-first (TDD)** — Write tests (unit, API, E2E) before implementation; then implement until all tests pass.
3. **Quality gates** — Run three validation steps on new tests before writing production code.
4. **Commit checkpoints** — Commit at natural boundaries (domain, service, API, UI, i18n); update docs when needed.

---

## Feature Development (TDD 6-Step Loop)

Every feature follows this loop. Steps 1–3 are done **before** any implementation code.

| Step | What to do |
|------|------------|
| **1. Unit/integration tests** | Write Vitest tests for domain services, API routes, and components. Use Good/Bad/Edge structure. See `.cursor/rules/testing.mdc` and `e-kost-test-author` skill. |
| **2. E2E tests** | Write Playwright tests for atomic user actions in the feature (Good/Bad/Edge). Location: `e2e/<feature>/`. See `e-kost-e2e-test-author` skill. |
| **3. Validate test quality** | Run the three quality gates (see below). Use `e-kost-test-validator` skill. No implementation until all gates pass. |
| **4. Implement** | Write production code so all tests pass. |
| **5. Iterate** | Fix failures, re-run the feature’s tests until 0 failures. |
| **6. Regression** | Run full Vitest suite (`npx vitest run`) and full Playwright suite (`npx playwright test`). Fix any regressions in implementation, not in existing tests. |

**Rules:**

- If an **existing** test fails in step 6, the new code caused a regression → fix the implementation, not the old test.
- If a **quality gate** fails (e.g. a fault survives Gate 2), improve the tests (add/strengthen assertions), not the fault or the implementation.

### Test quality gates (step 3)

Before implementing, all three must pass:

1. **Gate 1 — Structural**  
   `npx tsx scripts/validate-tests.ts --feature <name>`  
   Must report zero errors.

2. **Gate 2 — Fault injection**  
   Introduce faulty stubs (e.g. wrong return values); run tests. Every fault must be *killed* (at least one test fails). If a fault survives, add or strengthen test assertions.

3. **Gate 3 — Review checklist**  
   Walk the checklist in `.cursor/rules/test-quality-gates.mdc` (assertion specificity, mock integrity, boundary coverage, etc.). Fix any FLAGs before implementation.

Detailed test structure (Good/Bad/Edge, file locations, E2E tiers) is in `.cursor/rules/testing.mdc`.

---

## Commit Checkpoints

After completing a logical unit of work, pause and consider a commit. Good boundaries:

- Domain layer done (entities, interfaces, schemas)
- Service layer done (business logic + unit tests)
- API layer done (routes + repository implementation)
- UI layer done (components + hooks)
- i18n done (translation keys in `locales/en.json`, `locales/id.json`)
- Standalone fix, refactor, or config change

**Before committing:**

1. **Summarize** — `git diff --stat`; 2–3 bullet summary; file/line counts.
2. **Docs** — If you changed behavior or structure, consider updating:
   - `README.md` (Development Status, Getting Started, Project Structure)
   - `specs/architecture-intent.md`, `specs/data-architecture.md` (structural/data model changes)
   - `specs/<feature>/tasks.md` (task completed)
   - `specs/<feature>/design.md` (design change)
3. **Commit message** — Use conventional commits: `type(scope): short description` (e.g. `feat(rooms): add status filter`). Second line blank; then bullet list of changes. The project does not auto-commit; you run `git add` and `git commit` yourself.

Full checkpoint workflow and message format: `.cursor/rules/commit-checkpoints.mdc`.

---

## Where things live

| Topic | Location |
|------|----------|
| Feature specs | `specs/<feature>/` (requirements.md, design.md, tasks.md) |
| Architecture | `specs/architecture-intent.md`, `specs/data-architecture.md` |
| Cross-cutting rules | `specs/cross-cutting-constraints.md` |
| Testing standards (full) | `.cursor/rules/testing.mdc` |
| Test quality gates (checklist) | `.cursor/rules/test-quality-gates.mdc` |
| Commit checkpoints (full) | `.cursor/rules/commit-checkpoints.mdc` |
| Test validation script | `npx tsx scripts/validate-tests.ts --feature <name>` |

---

## E2E test strategy

- **Tier 1 (per feature):** Atomic user-action tests in `e2e/<feature>/`. Written with the feature. One spec file per key action (e.g. `e2e/auth/register.spec.ts`).
- **Tier 2 (post-MVP):** Cross-feature journey tests in `e2e/journeys/`. Written after all features are complete (e.g. full onboarding flow).

During feature work, only Tier 1 is written; Tier 2 is for later.
