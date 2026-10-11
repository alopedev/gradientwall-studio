import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getPacks } from "@/lib/packs";
import { PacksSection } from "./PacksSection";

function packLinks(): string[] {
  return screen
    .getAllByRole("link")
    .map((a) => a.getAttribute("href") ?? "")
    .filter((h) => h.startsWith("/packs/"));
}

describe("PacksSection", () => {
  it("renders every pack in the manifest, none dropped by the Bento layout", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    const slugs = getPacks().map((p) => `/packs/${p.slug}`);
    expect(packLinks().sort()).toEqual([...slugs].sort());
  });

  it("does not promise a fixed number of wallpapers per pack", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/\bten\b/i)).toBeNull();
  });

  it("describes Dessau as 6 designs, 12 wallpapers", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    expect(screen.getByText(/6 designs · 12 wallpapers/)).toBeInTheDocument();
  });
});
