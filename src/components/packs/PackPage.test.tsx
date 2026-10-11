import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

describe("PackPage showcase and specs", () => {
  it("opens with a device carousel of the pack's pieces", () => {
    renderPack("acrylic");
    expect(screen.getByText("01 / 10")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /impasto wallpapers/i })).toBeInTheDocument();
  });

  it("lists exact files, sizes, format and licence in a spec block", () => {
    renderPack("acrylic");
    const specs = screen.getByRole("list", { name: /specifications/i });
    expect(within(specs).getByText("10 × 4K and 5K")).toBeInTheDocument();
    expect(within(specs).getByText("3840 × 2160 · 5120 × 2880")).toBeInTheDocument();
    expect(within(specs).getByText("10 × iPhone & Android")).toBeInTheDocument();
    expect(within(specs).getByText("1320 × 2868")).toBeInTheDocument();
    expect(within(specs).getByText(/personal use/i)).toBeInTheDocument();
  });

  it("counts Dessau's files from its own six pieces", () => {
    renderPack("dessau");
    const specs = screen.getByRole("list", { name: /specifications/i });
    expect(within(specs).getByText("6 × 4K and 5K")).toBeInTheDocument();
  });

  it("introduces the gallery as what's inside", () => {
    renderPack("dessau");
    expect(screen.getByText(/what's inside/i)).toBeInTheDocument();
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
