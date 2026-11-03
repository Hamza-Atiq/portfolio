import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Tests use the committed fixture bundle, never the generated site data.
      { find: "@/data/content.json", replacement: path.resolve(__dirname, "tests/fixture-content.json") },
      { find: /^@\//, replacement: path.resolve(__dirname) + "/" },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
