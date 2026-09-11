import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "@shared": path.resolve(root, "shared"),
    },
  },
  server: {
    host: true,
    port: 4317,
    proxy: {
      "/api": { target: "http://127.0.0.1:4318", changeOrigin: true },
      "/ws": { target: "ws://127.0.0.1:4318", ws: true },
    },
  },
  preview: {
    host: true,
    port: 4317,
  },
});
