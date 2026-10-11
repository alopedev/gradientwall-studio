import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

  it("shows each pack on a laptop and a phone, with its name over the art", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    for (const pack of getPacks()) {
      const link = screen
        .getAllByRole("link")
        .find((a) => a.getAttribute("href") === `/packs/${pack.slug}`)!;
      const shots = [...link.querySelectorAll("img[alt]:not([alt=''])")];
      expect(shots).toHaveLength(2);
      const heading = within(link).getByRole("heading", { name: new RegExp(pack.name) });
      expect(heading.className).toMatch(/font-serif/);
      expect(heading.className).toMatch(/italic/);
    }
  });

  it("lays two packs out as two cards, with no featured slot left over", () => {
    const { container } = render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    expect(container.querySelector("[data-variant='hero']")).toBeNull();
    expect(packLinks()).toHaveLength(getPacks().length);
  });
});
