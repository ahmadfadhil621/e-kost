#!/bin/bash
# Runs lint + type-check before any git commit.
# Blocks the commit (exit 2) if either check fails.
# Warnings are allowed through.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if echo "$COMMAND" | grep -q 'git commit'; then
  # 1. ESLint
  echo "Running lint before commit..." >&2
  LINT_OUTPUT=$(npm run lint 2>&1)
  LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c ' error ')
  if [ "$LINT_ERRORS" -gt 0 ]; then
    echo "$LINT_OUTPUT" >&2
    echo "" >&2
    echo "Lint failed with $LINT_ERRORS error(s). Fix them before committing." >&2
    exit 2
  fi

  # 2. TypeScript type-check (source files only, excludes tests)
  echo "Running type-check before commit..." >&2
  TSC_OUTPUT=$(npx tsc --noEmit -p tsconfig.check.json 2>&1)
  if [ $? -ne 0 ]; then
    echo "$TSC_OUTPUT" >&2
    echo "" >&2
    echo "Type-check failed. Fix type errors before committing." >&2
    exit 2
  fi
fi

exit 0
