import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/lib/payment-service.fault-injection.test.ts",
      "src/lib/note-service.fault-injection.test.ts",
      "src/lib/balance-service.fault-injection.test.ts",
      "src/lib/dashboard-service.fault-injection.test.ts",
    ],
    exclude: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
