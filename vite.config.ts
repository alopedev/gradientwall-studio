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
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "netlify/**/*.test.ts"],
    globals: false,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    // Functions run in Node serverless — netlify/**/*.test.ts files declare
    // `// @vitest-environment node` on line 1 so jose/crypto behave as at
    // runtime (jsdom's TextEncoder yields a Uint8Array jose v5 rejects).
  },
});
