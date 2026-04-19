import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Palettes } from "./Palettes";
import { useConfigStore } from "@/store/useConfigStore";
import { useUIStore } from "@/store/useUIStore";
import { PALETTES } from "@/lib/palettes";
import { resetStores } from "@/test-utils";

describe("<Palettes />", () => {
  beforeEach(resetStores);

  it("renders all palettes with their names (DOM is mixed-case; uppercase is a CSS transform)", () => {
    render(<Palettes />);
    for (const p of PALETTES) {
      expect(screen.getByText(p.name)).toBeInTheDocument();
    }
  });

  it("marks locked palettes with a PREMIUM label (one per locked)", () => {
    render(<Palettes />);
    const premiumLabels = screen.getAllByText(/PREMIUM/);
    const lockedCount = PALETTES.filter((p) => p.locked).length;
    expect(premiumLabels).toHaveLength(lockedCount);
  });

  it("clicking an unlocked palette applies its colors + marks it active in UI store", () => {
    const unlockedIdx = PALETTES.findIndex((p) => !p.locked && p.name !== "Dusk");
    const palette = PALETTES[unlockedIdx];
    render(<Palettes />);
    fireEvent.click(screen.getByText(palette.name).closest("div.palette-card, div.liquid-subtle") ?? screen.getByText(palette.name));
    expect(useConfigStore.getState().colors).toEqual(palette.colors);
    expect(useUIStore.getState().activePalette).toBe(unlockedIdx);
  });

  it("clicking a locked palette is a no-op on the config", () => {
    const lockedIdx = PALETTES.findIndex((p) => p.locked);
    const palette = PALETTES[lockedIdx];
    const beforeColors = useConfigStore.getState().colors;
    const beforeActive = useUIStore.getState().activePalette;
    render(<Palettes />);
    fireEvent.click(screen.getByText(palette.name).closest("div.palette-card, div.liquid-subtle") ?? screen.getByText(palette.name));
    expect(useConfigStore.getState().colors).toBe(beforeColors);
    expect(useUIStore.getState().activePalette).toBe(beforeActive);
  });
});
