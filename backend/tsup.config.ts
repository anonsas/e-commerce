import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/instrument.ts"],
  format: ["cjs"],
  target: "node24",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // bundles everything — resolves @/* aliases and eliminates the need for tsc-alias
  bundle: true,
  // keep native addons and pg driver external to avoid bundling binary deps
  external: ["pg-native"],
});
