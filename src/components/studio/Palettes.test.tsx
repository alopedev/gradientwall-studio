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

  it("does not render any PREMIUM marker — all palettes are unlocked since the store is free", () => {
    render(<Palettes />);
    expect(screen.queryByText(/PREMIUM/)).toBeNull();
  });

  it("clicking any palette applies its colors + marks it active in UI store", () => {
    const idx = PALETTES.findIndex((p) => p.name === "Ember");
    const palette = PALETTES[idx];
    render(<Palettes />);
    fireEvent.click(screen.getByText(palette.name));
    expect(useConfigStore.getState().colors).toEqual(palette.colors);
    expect(useUIStore.getState().activePalette).toBe(idx);
  });
});
