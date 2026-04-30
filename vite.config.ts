import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/proxy-api': {
        target: 'https://api.101recycle.greenbidz.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy-api/, '/api/v1'),
        timeout: 120000,
        proxyTimeout: 120000,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2017", 
    polyfillDynamicImport: true, // optional: helps with older Safari versions
  },
}));
