import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    // Allow the Vite dev server to be served via a public Cloudflare Tunnel for
    // mobile / remote testing. Restrict to .trycloudflare.com subdomains only.
    allowedHosts: [".trycloudflare.com"],
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
    environment: "node",
  },
});
