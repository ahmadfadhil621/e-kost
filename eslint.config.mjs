import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    extends: [nextCoreWebVitals, nextTypescript],
  },
  globalIgnores([
    "src/generated/**",
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Strict but sensible: avoid common bugs and sloppy patterns
      "eqeqeq": ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "curly": ["error", "all"],
      "no-var": "error",
      "prefer-const": "error",
      // React Compiler rules: disabled (project does not use React Compiler)
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      // TypeScript: ban explicit any (no-floating-promises needs type-aware config)
      "@typescript-eslint/no-explicit-any": "error",
      // Unused vars: allow _prefix for intentionally unused; argsIgnorePattern for callbacks
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Scripts and e2e: allow console.log for CLI output and test debugging
  {
    files: ["scripts/**/*.ts", "e2e/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
