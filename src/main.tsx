import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { validateCatalog } from "./lib/store";
import { startLookFor } from "./store/page-start";

if (import.meta.env.DEV) {
  const issues = validateCatalog();
  if (issues.length) console.warn("[catalog]", issues);
}

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
// Same starting look as the prerender gave this page, before the first render.
startLookFor(window.location.pathname);
// Prerendered pages (vite.config.ts) carry the page in #root: reuse it.
if (root.hasAttribute("data-ssr")) hydrateRoot(root, app);
else createRoot(root).render(app);
