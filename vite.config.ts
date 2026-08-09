import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@platform": path.resolve(__dirname, "app/platform"),
      "@features": path.resolve(__dirname, "features"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
  },
});
