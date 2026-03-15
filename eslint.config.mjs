import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),
  {
    ignores: [
      "src/generated/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Strict but sensible: avoid common bugs and sloppy patterns
      "eqeqeq": ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "curly": ["error", "all"],
      "no-var": "error",
      "prefer-const": "error",
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
];

export default eslintConfig;
