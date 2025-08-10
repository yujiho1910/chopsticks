/**
 * Vitest configuration for clearer output and quick coverage summary.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary"],
      reportsDirectory: "./coverage",
  exclude: ["public/dist/**", "tests/**"],
    },
  },
});
