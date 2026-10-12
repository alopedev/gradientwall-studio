import { describe, it, expect, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Nav } from "./Nav";
import { getPacks } from "@/lib/packs";
import { paletteName } from "@/lib/palette-name";
import type { Colors4 } from "@/lib/palettes";
import { useConfigStore } from "@/store/useConfigStore";
import { type FavoriteItem, useFavoritesStore } from "@/store/useFavoritesStore";

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
    expect(screen.getByText(/make a wallpaper/i)).toBeInTheDocument();
  });

  it("signs with the logo: the window mark and the wordmark, named for screen readers", () => {
    render(<Nav />);
    const brand = screen.getByRole("link", { name: "gradientwall" });
    expect(brand.querySelector("svg[data-brand-mark]")).toBeInTheDocument();
    expect(brand.querySelector("svg[data-wordmark]")).toBeInTheDocument();
  });

  it("is split into separate paper islands with an ink edge and no glass blur", () => {
    const { container } = render(<Nav />);
    const islands = container.querySelectorAll<HTMLElement>("[data-island]");
    expect(islands.length).toBe(3);
    for (const island of islands) {
      expect(island.style.backdropFilter).toBe("");
      expect(island.style.boxShadow).toContain("var(--color-ink)");
    }
  });

  it("opens the Packs menu with one link per pack, its size and price", () => {
    render(<Nav />);
    const button = screen.getByRole("button", { name: /^packs$/i });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    const menu = screen.getByRole("region", { name: /packs/i });
    for (const pack of getPacks()) {
      const link = within(menu).getByRole("link", { name: new RegExp(pack.name, "i") });
      expect(link).toHaveAttribute("href", `/packs/${pack.slug}`);
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
