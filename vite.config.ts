import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globals: true,
    testTimeout: 30000,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json-summary", "json"]
    },
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
    // setupFiles: ["test/setup.ts"],
  },
  plugins: [tsconfigPaths()]
});
