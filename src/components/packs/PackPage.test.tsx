import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PackPage } from "./PackPage";

function renderPack(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/packs/${slug}`]}>
      <Routes>
        <Route path="/packs/:slug" element={<PackPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PackPage", () => {
  it("shows all six Dessau pieces with their phone and desktop renders", () => {
    const { container } = renderPack("dessau");
    expect(screen.getByRole("heading", { name: "All 6 wallpapers." })).toBeInTheDocument();
    const srcs = [...container.querySelectorAll("img")].map((i) => i.getAttribute("src"));
    expect(srcs).toContain("/assets/packs/dessau/06_halbkreise.png");
    expect(srcs).toContain("/assets/packs/dessau/06_halbkreise-desktop.png");
  });
});
