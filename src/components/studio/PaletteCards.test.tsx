import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { useConfigStore } from "@/store/useConfigStore";
import { useUIStore } from "@/store/useUIStore";
import { resetStores } from "@/test-utils";
import { PaletteCards } from "./PaletteCards";

describe("<PaletteCards />", () => {
  beforeEach(resetStores);

  it("renderiza solo las paletas con featured=true", () => {
    const featuredCount = PALETTES.filter((p) => p.featured).length;
    render(<PaletteCards />);
    const cards = screen.getAllByRole("button", { name: /^Apply palette/ });
    expect(cards).toHaveLength(featuredCount);
  });

  it("incluye Dusk, Tokyo, Forest y Mocha como featured iniciales", () => {
    render(<PaletteCards />);
    expect(screen.getByRole("button", { name: "Apply palette Dusk" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply palette Tokyo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply palette Forest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply palette Mocha" })).toBeInTheDocument();
  });

  it("click en una card aplica esa paleta al store de config y la marca activa", () => {
    render(<PaletteCards />);
    fireEvent.click(screen.getByRole("button", { name: "Apply palette Tokyo" }));
    // applyPalette mira el índice GLOBAL en PALETTES, no el del subset featured
    const tokyoIdx = PALETTES.findIndex((p) => p.name === "Tokyo");
    expect(useConfigStore.getState().colors).toEqual(PALETTES[tokyoIdx].colors);
    expect(useUIStore.getState().activePalette).toBe(tokyoIdx);
  });

  it("la paleta activa lleva aria-pressed=true", () => {
    const duskIdx = PALETTES.findIndex((p) => p.name === "Dusk");
    useUIStore.setState({ activePalette: duskIdx });
    render(<PaletteCards />);
    const dusk = screen.getByRole("button", { name: "Apply palette Dusk" });
    expect(dusk).toHaveAttribute("aria-pressed", "true");
    const tokyo = screen.getByRole("button", { name: "Apply palette Tokyo" });
    expect(tokyo).toHaveAttribute("aria-pressed", "false");
  });
});
