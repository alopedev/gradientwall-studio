import { describe, it, expect, vi } from "vitest";
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
    expect(screen.getByRole("heading", { name: "All 6 designs." })).toBeInTheDocument();
    const srcs = [...container.querySelectorAll("img")].map((i) => i.getAttribute("src"));
    expect(srcs).toContain("/assets/packs/dessau/06_halbkreise.png");
    expect(srcs).toContain("/assets/packs/dessau/06_halbkreise-desktop.png");
  });
});

describe("PackPage buying", () => {
  it("sends buyers to the Etsy listing while there is no checkout of its own", () => {
    renderPack("dessau");
    const link = screen.getByRole("link", { name: /get it on etsy/i });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/www\.etsy\.com\/listing\/\d+$/);
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("keeps a second buy link in a bar once the main button is out of view", () => {
    class OffScreen {
      constructor(private cb: IntersectionObserverCallback) {}
      observe() {
        this.cb([{ isIntersecting: false } as IntersectionObserverEntry], this as never);
      }
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", OffScreen);
    try {
      renderPack("dessau");
      expect(screen.getAllByRole("link", { name: /get it on etsy/i })).toHaveLength(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("declares that the artwork is AI-assisted", () => {
    renderPack("acrylic");
    expect(screen.getByText(/how it was made/i)).toBeInTheDocument();
    expect(screen.getAllByText(/AI-assisted image generation/i).length).toBeGreaterThan(0);
  });
});
