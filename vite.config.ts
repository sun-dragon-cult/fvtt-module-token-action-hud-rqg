import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  publicDir: "static",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: mode !== "development",
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: () => "scripts/token-action-hud-rqg.js",
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
}));
