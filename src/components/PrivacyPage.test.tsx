// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrivacyPage } from "./PrivacyPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>,
  );

describe("PrivacyPage", () => {
  it("names who is responsible and how to reach them", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: /privacy/i })).toBeTruthy();
    expect(screen.getAllByText(/Àlex Olivé Pérez/).length).toBeGreaterThan(0);
    const mail = screen.getAllByRole("link", { name: "alexoliveperez@gmail.com" })[0];
    expect(mail.getAttribute("href")).toBe("mailto:alexoliveperez@gmail.com");
  });

  it("covers the email list: purpose, legal basis, retention, rights and the regulator", () => {
    renderPage();
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/new packs and Studio features/i);
    expect(text).toMatch(/your consent/i);
    expect(text).toMatch(/until you unsubscribe/i);
    for (const right of [/access/i, /rectif/i, /erasure/i, /withdraw/i]) {
      expect(text).toMatch(right);
    }
    expect(screen.getByRole("link", { name: /aepd\.es/i })).toBeTruthy();
  });

  it("covers purchases and who processes the data", () => {
    renderPage();
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Etsy/);
    expect(text).toMatch(/Supabase/);
    expect(text).toMatch(/Netlify/);
  });
});
