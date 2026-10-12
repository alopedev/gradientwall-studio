// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PackPurchaseSuccess } from "./packs/PackPurchaseSuccess";
import { RecoverForm } from "./RecoverForm";

// Service pages share the site's one headline voice: lowercase, no serif italic accent.
function expectOneVoice(h1: HTMLElement, text: string) {
  expect(h1.textContent).toBe(text);
  expect(h1.className).toMatch(/display-head/);
  expect(h1.querySelector("[class*='serif'], em, i")).toBeNull();
}

describe("service page headlines", () => {
  it("recover: asks the question plainly", () => {
    render(
      <MemoryRouter>
        <RecoverForm />
      </MemoryRouter>,
    );
    expectOneVoice(screen.getByRole("heading", { level: 1 }), "lost your download link?");
  });

  it("purchase success: thanks, then where to look", () => {
    render(
      <MemoryRouter initialEntries={["/packs/dessau/success"]}>
        <Routes>
          <Route path="/packs/:slug/success" element={<PackPurchaseSuccess />} />
        </Routes>
      </MemoryRouter>,
    );
    expectOneVoice(screen.getByRole("heading", { level: 1 }), "thanks. check your inbox.");
    expect(screen.queryByText(/—/)).toBeNull();
  });
});
