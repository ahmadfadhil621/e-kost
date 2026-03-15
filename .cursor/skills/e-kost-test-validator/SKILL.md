---
name: e-kost-test-validator
description: Validate test quality before implementation begins (workflow step 3). Runs Gate 1 structural analysis, Gate 2 fault injection, and Gate 3 review checklist. Use after unit/integration tests and E2E tests are written but before any production code is implemented.
---

# E-Kost Test Validator (Quality Gates -- Workflow Step 3)

This skill covers **step 3** of the feature development workflow: validating that tests are meaningful before they become the source of truth for implementation. For the full workflow, see `.cursor/rules/testing.mdc`.

## When to Use

After the test-author (step 1) and e2e-test-author (step 2) skills have produced test files, and before any implementation code is written.

## Workflow

1. **Gate 1: Run structural analysis** -- `npx tsx scripts/validate-tests.ts --feature <feature-name>`
2. **Gate 2: Fault injection** -- Create faulty stubs, run tests against them, verify all faults are killed
3. **Gate 3: Review checklist** -- Walk through the checklist in `.cursor/rules/test-quality-gates.mdc`
4. If all three gates pass, **hand off to step 4** (implementation)

## Gate 1: Structural Analysis

Run the automated script:

```bash
npx tsx scripts/validate-tests.ts --feature <feature-name>
```

The script checks:
- Good/Bad/Edge describe structure in every test file
- At least one assertion per test block
- No weak-only assertions (toBeDefined, toBeTruthy used alone)
- Property-based tests have `{ numRuns: 100 }` or higher
- Bad-case tests assert on error conditions
- Spec traceability: correctness properties and acceptance criteria are covered

**Pass criteria:** Zero errors (exit code 0). Warnings should be reviewed but do not block.

If errors are found, fix the test files and re-run until clean. Do NOT proceed to Gate 2 with Gate 1 errors.

## Gate 2: Fault Injection

This is the core quality check. Create deliberately buggy implementations and verify the tests reject them.

### Step 1: Identify Fault Targets

Read the feature's specs to identify critical behaviors:
- `specs/<feature>/design.md` -- Correctness Properties section
- `specs/<feature>/requirements.md` -- Acceptance Criteria

For each service or module being tested, identify 3-8 faults that represent plausible bugs. Every correctness property should have at least one corresponding fault.

### Step 2: Create Fault Stubs

Create a fault file at `src/test/faults/<feature>.faults.ts`. This file is ephemeral (gitignored) and exists only during validation.

Structure:

```typescript
// src/test/faults/<feature>.faults.ts

export interface Fault {
  id: string;
  description: string;
  property: string;  // which correctness property this should violate
}

export const faults: Fault[] = [
  {
    id: 'missing-id',
    description: 'createRoom returns result without id field',
    property: 'Property 1: Room Creation Completeness',
  },
  {
    id: 'wrong-default-status',
    description: 'createRoom sets status to occupied instead of available',
    property: 'Property 1: Room Creation Completeness',
  },
  {
    id: 'no-validation',
    description: 'createRoom accepts negative rent without error',
    property: 'Property 2: Required Field Validation',
  },
  {
    id: 'no-uniqueness-check',
    description: 'createRoom allows duplicate room numbers',
    property: 'Property 14: Room Number Uniqueness Enforcement',
  },
  {
    id: 'wrong-status-code',
    description: 'API returns 200 instead of 400 for invalid input',
    property: 'Property 2: Required Field Validation',
  },
];
```

### Step 3: Write and Run Faulty Implementations

For each fault, create a minimal stub that is deliberately wrong in the described way. The stub must be wired into the test's dependency injection (mock repository, MSW handler override, or direct function replacement).

**How to inject faults by test layer:**

**Domain/Service tests:** Replace the mock repository's return value or behavior:

```typescript
// Example: testing that createRoom validates required fields
// Fault: no-validation — the service accepts anything
describe('fault: no-validation', () => {
  it('should be caught by bad-case tests', async () => {
    const faultyService = new RoomService({
      async create(data) {
        // BUG: no validation, accepts any data
        return { id: crypto.randomUUID(), ...data, status: 'available', createdAt: new Date() };
      },
      // ... other methods
    });

    // Run the same test assertions against the faulty service
    // If this does NOT throw, the tests are too weak
    const result = await faultyService.createRoom({ roomNumber: '', roomType: '', monthlyRent: -100 });
    // If we get here without error, the fault survived
  });
});
```

**API route tests:** Override MSW handlers with faulty responses:

```typescript
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// Fault: wrong-status-code — returns 200 for invalid input
server.use(
  http.post('/api/properties/:pid/rooms', () => {
    return HttpResponse.json({ id: 'fake' }, { status: 200 });
  }),
);
```

**Component tests:** Supply faulty props or mock hook returns:

```typescript
// Fault: missing-field — component receives data without a required field
render(<RoomCard room={{ roomType: 'single', monthlyRent: 1500 } as any} />);
// Tests should catch the missing room number
```

### Step 4: Execute and Record Results

For each fault:

1. Temporarily wire the faulty stub into the relevant test file or test setup
2. Run the test file: `npx vitest run <test-file-path>`
3. Record the result:
   - **Killed** = at least one test failed (good -- the tests caught the bug)
   - **Survived** = all tests passed (bad -- the tests missed this bug)
4. Revert the faulty stub before testing the next fault

### Step 5: Report

Produce a fault injection report:

```
Fault Injection Report: <feature-name>
═══════════════════════════════════════

Faults tested: 5
Killed:        4
Survived:      1

KILLED  missing-id           (Property 1) -- caught by 'creates a room with valid data'
KILLED  wrong-default-status (Property 1) -- caught by 'room creation returns complete object...'
KILLED  no-validation        (Property 2) -- caught by 'rejects when monthly rent is negative'
SURVIVED no-uniqueness-check (Property 14) -- NO TEST CAUGHT THIS FAULT
KILLED  wrong-status-code    (Property 2) -- caught by 'returns 400 when room number is missing'

ACTION REQUIRED: 1 surviving fault(s). Strengthen tests before proceeding.
```

### Step 6: Fix Surviving Faults

For each surviving fault:
1. Identify which correctness property it maps to
2. Add or strengthen a test that would catch this specific bug
3. Re-run the fault to confirm it is now killed
4. Repeat until all faults are killed

**Pass criteria:** Zero surviving faults.

### Fault Catalog by Layer

Use these as starting points when designing faults for a feature. Not every fault applies to every feature — select the ones relevant to the correctness properties.

**Data integrity faults:**
- Missing auto-generated field (id, createdAt, updatedAt)
- Wrong default value (status, role, type)
- Field not persisted (data accepted but not saved)
- Timestamp not updated on mutation

**Validation faults:**
- No validation at all (accepts any input)
- Missing uniqueness check (duplicates allowed)
- Wrong boundary (off-by-one on min/max length)
- Type coercion (string accepted where number expected)

**Status/state faults:**
- Wrong initial state
- Invalid state transition allowed
- State change not persisted

**API contract faults:**
- Wrong HTTP status code
- Missing field in response body
- Wrong response shape (array vs object)
- Error response without error message

**UI faults:**
- Missing field in rendered output
- Wrong status indicator displayed
- Form submits without required field
- Error message not shown on validation failure

## Gate 3: Review Checklist

After Gates 1 and 2 pass, walk through the review checklist defined in `.cursor/rules/test-quality-gates.mdc`. This catches semantic issues that automation and fault injection cannot.

Read that file and evaluate each checklist item against the test files. Report any findings.

**Pass criteria:** No blocking findings. Minor suggestions can be noted for future improvement.

## Hard Constraints

- Never modify test files written by the test-author or e2e-test-author skills to make faults pass. If a fault survives, the fix is to ADD assertions, not weaken faults.
- Fault files (`src/test/faults/`) are ephemeral. Delete them after validation. They must never be committed.
- All three gates must pass before handing off to implementation (step 4).
- If Gate 2 requires test changes, re-run Gate 1 after the changes to ensure structural checks still pass.

## Reference Files

Before validating tests for a feature, always read:
1. `specs/<feature>/design.md` -- Correctness Properties section
2. `specs/<feature>/requirements.md` -- Acceptance Criteria
3. `.cursor/rules/test-quality-gates.mdc` -- Gate 3 review checklist
4. The test files produced by steps 1 and 2
