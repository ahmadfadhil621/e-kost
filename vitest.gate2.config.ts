import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/** Use for Gate 2 fault injection: run only fault-injection test files. */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.fault-injection.test.ts"],
    exclude: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
