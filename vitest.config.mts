import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    include: ["**/__tests__/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    environment: "node",
  },
});
