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

  it("describes Dessau as 6 designs for phone and desktop, up to 5K", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    const dessau = packLink("dessau");
    expect(within(dessau).getByText("6 designs")).toBeInTheDocument();
    expect(within(dessau).getByText("Phone + desktop")).toBeInTheDocument();
    expect(within(dessau).getByText("Up to 5K")).toBeInTheDocument();
  });

  it("says where each pack is sold and invites to see it, once per card", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    for (const pack of getPacks()) {
      const link = packLink(pack.slug);
      expect(within(link).getByText("See the pack →")).toBeInTheDocument();
      if (pack.etsyUrl) expect(within(link).getByText("sold on Etsy")).toBeInTheDocument();
      // The count shows once, not as a badge and a tag.
      expect(within(link).getAllByText(`${pack.previews.length} designs`)).toHaveLength(1);
    }
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
      expect(heading.className).toMatch(/display-head/);
      expect(heading.className).not.toMatch(/serif|italic/);
      expect(heading.textContent).toBe(pack.name);
    }
  });

  it("titles the section in one lowercase voice, with the price folded into the intro", () => {
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>,
    );
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2.textContent).toBe("wallpaper packs.");
    expect(h2.querySelector("[class*='serif']")).toBeNull();
    expect(screen.getByText(/€5\.99 each, VAT included/)).toBeInTheDocument();
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
