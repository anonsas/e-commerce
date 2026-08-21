import { defineConfig } from "vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: {
      "@lib": `${import.meta.dirname}/src/lib`,
      "@utils": `${import.meta.dirname}/src/utils`,
      "@pages": `${import.meta.dirname}/src/pages`,
      "@context": `${import.meta.dirname}/src/context`,
      "@components": `${import.meta.dirname}/src/components`,
      "@constants": `${import.meta.dirname}/src/constants.ts`,
      "@ecommerce/shared": `${import.meta.dirname}/../shared/src/index.ts`,
    },
  },
});
