import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  base: "./",
  build: {
    target: "esnext",
    outDir: "dist-react",
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
