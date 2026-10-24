// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LicencePage } from "./LicencePage";

describe("LicencePage", () => {
  it("says what the free wallpapers may and may not be used for", () => {
    render(
      <MemoryRouter>
        <LicencePage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: /licence/i })).toBeTruthy();
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/free\s+for personal use/i);
    expect(text).toMatch(/sell the files/i);
  });
});
