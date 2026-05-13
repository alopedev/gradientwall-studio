import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { validateCatalog } from "./lib/store";

if (import.meta.env.DEV) {
  const issues = validateCatalog();
  if (issues.length) console.warn("[catalog]", issues);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
