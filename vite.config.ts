import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"]
        }
      }
    }
  },
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "json-summary"]
    }
  }
});
