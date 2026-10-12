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

function packLink(slug: string): HTMLElement {
  return screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/packs/${slug}`)!;
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

  it("shows each pack as a fan of its phone wallpapers, with its name over the art", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    for (const pack of getPacks()) {
      const link = packLink(pack.slug);
      const phones = link.querySelectorAll("[data-device='phone']");
      expect(phones).toHaveLength(Math.min(5, pack.previews.length));
      expect(link.querySelector("[data-device='laptop']")).toBeNull();
      const heading = within(link).getByRole("heading", { name: new RegExp(pack.name) });
      expect(heading.className).toMatch(/font-serif/);
      expect(heading.className).toMatch(/italic/);
    }
  });

  it("says how many designs each pack has and what it costs", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    for (const pack of getPacks()) {
      const link = packLink(pack.slug);
      expect(within(link).getByText(`${pack.previews.length} designs`)).toBeInTheDocument();
      expect(within(link).getByText(`€${pack.priceEur.toFixed(2)}`)).toBeInTheDocument();
    }
  });

  it("names the fanned wallpapers once, for screen readers, not five times", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    for (const pack of getPacks()) {
      const named = packLink(pack.slug).querySelectorAll("img[alt]:not([alt=''])");
      expect(named).toHaveLength(1);
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
