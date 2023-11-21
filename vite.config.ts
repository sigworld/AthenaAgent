import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globals: true,
    // setupFiles: ["test/setup.ts"],
    testTimeout: 10000
    // poolOptions: {
    //   threads: {
    //     singleThread: true
    //   }
    // }
  },
  plugins: [tsconfigPaths()]
});
