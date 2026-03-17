---
name: test-validator
description: Validate test quality before implementation begins. Runs Gate 1 structural analysis, Gate 2 fault injection, and Gate 3 review checklist. Use after tests are written but before any production code.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Test Validator (Quality Gates)

Validate that tests are meaningful before implementation. For the review checklist, see `.claude/rules/test-quality-gates.md`.

## When to Use

After tests are written (via `/test-author` and `/e2e-test-author` skills) and before any implementation code.

## Gate 1: Structural Analysis

```bash
npx tsx scripts/validate-tests.ts --feature <feature-name>
```

Checks: Good/Bad/Edge structure, assertion presence, no weak-only assertions, property test iteration count, traceability coverage.

**Pass criteria:** Zero errors. Fix test files and re-run until clean. Do NOT proceed to Gate 2 with errors.

## Gate 2: Fault Injection

### Process

1. **Identify fault targets** from `specs/<feature>/design.md` (Correctness Properties) and `specs/<feature>/requirements.md` (Acceptance Criteria). Select 3-8 faults per service/module.

2. **Create fault stubs** at `src/test/faults/<feature>.faults.ts` (ephemeral, gitignored):

```typescript
export const faults = [
  { id: 'missing-id', description: 'createRoom returns result without id', property: 'Property 1' },
  { id: 'no-validation', description: 'createRoom accepts negative rent', property: 'Property 2' },
];
```

3. **Inject and run**: For each fault, create a deliberately buggy stub, wire it into the test setup, run the tests.

4. **Record results**:
   - **Killed** = at least one test failed (good)
   - **Survived** = all tests passed (bad -- tests missed this bug)

5. **Report**:

```
Fault Injection Report: <feature>
Faults: 5 | Killed: 4 | Survived: 1
SURVIVED  no-uniqueness-check (Property 14) -- NO TEST CAUGHT THIS
```

6. **Fix surviving faults**: Add/strengthen assertions, then re-run to confirm killed.

### Injection by Layer

- **Service tests**: Replace mock repository behavior
- **API tests**: Override MSW handlers with faulty responses
- **Component tests**: Supply faulty props or mock hook returns

### Fault Categories

- **Data integrity**: Missing auto-generated field, wrong default value, field not persisted
- **Validation**: No validation, missing uniqueness check, wrong boundary
- **State**: Wrong initial state, invalid transition allowed
- **API contract**: Wrong status code, missing field, wrong response shape
- **UI**: Missing field rendered, wrong indicator, form submits without required field

**Pass criteria:** Zero surviving faults.

## Gate 3: Review Checklist

Walk through the checklist in `.claude/rules/test-quality-gates.md`. Mark each item PASS or FLAG.

**Pass criteria:** No blocking findings.

## Hard Constraints

- Never modify tests to make faults pass -- add assertions instead
- Fault files are ephemeral -- delete after validation, never commit
- All three gates must pass before implementation
- If Gate 2 changes tests, re-run Gate 1

## Reference Files

1. `specs/<feature>/design.md` -- correctness properties
2. `specs/<feature>/requirements.md` -- acceptance criteria
3. `.claude/rules/test-quality-gates.md` -- Gate 3 checklist
