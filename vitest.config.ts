import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every HTTP test file resets the same TEST_DATABASE_URL.
    // Run files one at a time so they cannot delete each other's data.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
