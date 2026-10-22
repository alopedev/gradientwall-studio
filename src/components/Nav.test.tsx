import { describe, it, expect, beforeEach } from "vitest";
import { act, fireEvent, render as rtlRender, screen, within } from "@testing-library/react";
import { Nav } from "./Nav";
import { PAGE_COLUMN } from "./ui/layout";
import { getPacks } from "@/lib/packs";
import { paletteName } from "@/lib/palette-name";
import type { Colors4 } from "@/lib/palettes";
import { useConfigStore } from "@/store/useConfigStore";
import { type FavoriteItem, useFavoritesStore } from "@/store/useFavoritesStore";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

/** The links in it navigate, so it renders inside a router, as in the app. */
const render = (ui: ReactElement) => rtlRender(ui, { wrapper: MemoryRouter });

describe("<Nav />", () => {
  beforeEach(() => {
    act(() => useFavoritesStore.setState({ items: [] }));
  });

  it("renders brand, Studio link, Packs menu button and the CTA", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: /gradientwall/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /^studio$/i })).toHaveAttribute("href", "/#studio");
    expect(screen.getByRole("button", { name: /^packs$/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByText(/open the studio/i)).toBeInTheDocument();
  });

  it("signs with the logo: the window mark and the wordmark, named for screen readers", () => {
    render(<Nav />);
    const brand = screen.getByRole("link", { name: "gradientwall" });
    expect(brand.querySelector("svg[data-brand-mark]")).toBeInTheDocument();
    expect(brand.querySelector("svg[data-wordmark]")).toBeInTheDocument();
  });

  it("spans the same column as the page content", () => {
    const { container } = render(<Nav />);
    const column = container.querySelector("[data-nav-column]");
    for (const cls of PAGE_COLUMN.split(" ")) expect(column).toHaveClass(cls);
  });

  it("sits on the hero with no frame: no ink edges, no background, no glass", () => {
    const { container } = render(<Nav />);
    const strip = container.querySelector<HTMLElement>("[data-nav-strip]");
    expect(strip).toHaveAttribute("data-scrolled", "false");
    expect(strip?.style.backgroundColor).toBe("transparent");
    for (const el of container.querySelectorAll<HTMLElement>("nav, nav *")) {
      expect(el.style.boxShadow).not.toContain("var(--color-ink)");
      expect(el.style.backdropFilter).toBe("");
    }
  });

  it("turns into one floating paper strip with a soft shadow once the page scrolls", () => {
    const { container } = render(<Nav />);
    const strip = container.querySelector<HTMLElement>("[data-nav-strip]");
    act(() => {
      window.scrollY = 120;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(strip).toHaveAttribute("data-scrolled", "true");
    expect(strip?.style.backgroundColor).toBe("var(--color-bg)");
    expect(strip?.style.boxShadow).not.toBe("");
    expect(strip?.style.boxShadow).not.toContain("var(--color-ink)");
    act(() => {
      window.scrollY = 0;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(strip).toHaveAttribute("data-scrolled", "false");
  });

  it("gives the open Packs menu its own paper, so it reads over the hero", () => {
    const { container } = render(<Nav />);
    fireEvent.click(screen.getByRole("button", { name: /^packs$/i }));
    const panel = container.querySelector<HTMLElement>("[data-packs-island]");
    expect(panel?.style.backgroundColor).toBe("var(--color-bg)");
    expect(panel?.style.boxShadow).not.toContain("var(--color-ink)");
  });

  it("opens the Packs menu with one link per pack, its size and price", () => {
    render(<Nav />);
    const button = screen.getByRole("button", { name: /^packs$/i });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    const menu = screen.getByRole("region", { name: /packs/i });
    for (const pack of getPacks()) {
      const link = within(menu).getByRole("link", { name: new RegExp(pack.name, "i") });
      expect(link).toHaveAttribute("href", `/packs/${pack.slug}/`);
      expect(link).toHaveTextContent(`${pack.previews.length} wallpapers`);
      expect(link).toHaveTextContent(`€${pack.priceEur.toFixed(2)}`);
    }
    expect(within(menu).getByRole("link", { name: /all packs/i })).toHaveAttribute(
      "href",
      "/#packs",
    );
  });

  it("closes the Packs menu on Escape and gives focus back to the button", () => {
    render(<Nav />);
    const button = screen.getByRole("button", { name: /^packs$/i });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("closes the Packs menu when the pointer moves on to Studio, and highlights Studio", () => {
    render(<Nav />);
    const button = screen.getByRole("button", { name: /^packs$/i });
    fireEvent.click(button);
    const studio = screen.getByRole("link", { name: /^studio$/i });
    fireEvent.pointerEnter(studio);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(studio).toHaveAttribute("aria-current", "location");
  });

  it("keeps the highlight measured against the links, not the widening island", () => {
    const { container } = render(<Nav />);
    const button = screen.getByRole("button", { name: /^packs$/i });
    // The links sit in their own track, so the island growing around them
    // doesn't shift the offsets the highlight is placed with.
    expect(button.parentElement).toHaveAttribute("data-track");
    expect(container.querySelector("[data-track]")?.className).not.toMatch(/\bw-full\b|flex-1/);
  });

  it("lays the Packs panel out at a fixed width, so it never sets the island's width", () => {
    render(<Nav />);
    fireEvent.click(screen.getByRole("button", { name: /^packs$/i }));
    const content = screen.getByRole("region", { name: /packs/i }).firstElementChild as HTMLElement;
    expect(content.style.width).toMatch(/^\d+px$/);
  });

  it("shows the current Studio palette and follows it when it changes", () => {
    render(<Nav />);
    const colors = useConfigStore.getState().colors;
    expect(screen.getByRole("link", { name: /current palette/i })).toHaveTextContent(
      paletteName(colors),
    );

    const next: Colors4 = ["#ff4d8d", "#7b2ff7", "#00d1ff", "#140a2e"];
    act(() => useConfigStore.getState().setColors(next));
    expect(screen.getByRole("link", { name: /current palette/i })).toHaveTextContent(
      paletteName(next),
    );
  });

  it("counts saved wallpapers", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: /0 saved/i })).toBeInTheDocument();
    const item = { id: "a", config: {} as FavoriteItem["config"], createdAt: 0 };
    act(() => useFavoritesStore.setState({ items: [item] }));
    expect(screen.getByRole("link", { name: /1 saved/i })).toBeInTheDocument();
  });
});
