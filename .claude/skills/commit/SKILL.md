---
name: commit
description: Run quality gates (lint + Vitest) then stage, commit, and push. Proposes a conventional commit message and waits for user approval before running any git commands.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Edit
  - Glob
  - Grep
---

# Commit & Push

Run this skill when you are ready to commit a logical unit of work.

## Steps

1. **Quality gates** — run in order, stop and fix before proceeding if anything fails:
   ```bash
   npm run lint
   npm run test:run
   ```

   Additionally, if any changed files are under `e2e/`, run only those specific spec files before committing:
   ```bash
   # Identify touched E2E specs from git diff
   git diff --name-only | grep '^e2e/.*\.spec\.ts$'
   # Run each one, e.g.:
   npx playwright test e2e/settings/language-persistence.spec.ts
   ```
   Fix any failures before proceeding. Do NOT run the full Playwright suite — only the touched specs.

2. **Summarize changes**
   - Run `git diff --stat` to list changed files
   - Summarize what changed in 2-3 bullet points

3. **Propose commit message** following the project convention:
   - Format: `type(scope): short description`
   - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
   - Reference the GitHub issue number if applicable: `feat(rooms): add filter by status (issue #12)`

4. **Ask: "Commit and push?"** — wait for explicit user approval (yes or equivalent) before running any git commands.

5. **On approval:**
   ```bash
   git add <specific files>   # never git add -A or git add .
   git commit -m "..."
   git push
   ```

6. **After push:** ask "Would you like to continue to the next task?"

## Hard Constraints

- Never run git commands before the user approves
- Never use `git add -A` or `git add .` — always stage specific files by name
- Never skip lint or test gates — fix failures first
- If lint or tests fail, fix the issue and re-run the gate before proceeding
