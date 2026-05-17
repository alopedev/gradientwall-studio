// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { Colors4 } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { FavoritesStrip } from "./FavoritesStrip";

const baseConfig = (seed: number, colors: Colors4) => ({
  colors,
  style: "mesh" as const,
  blur: 48,
  grain: 32,
  seed,
  lightAngle: 135,
  density: 0.5,
  contrast: 1,
  vibrance: 1.05,
});

describe("FavoritesStrip", () => {
  beforeEach(() => {
    act(() => useFavoritesStore.getState().clear());
  });

  it("renders empty state when no items are pinned", () => {
    render(<FavoritesStrip />);
    expect(screen.getByLabelText(/favorites — empty/i)).toBeTruthy();
    expect(screen.getByText(/save your favorites/i)).toBeTruthy();
  });

  it("renders one thumbnail per pinned item", () => {
    act(() => {
      useFavoritesStore.getState().pin(baseConfig(1, ["#001122", "#334455", "#667788", "#aabbcc"]));
      useFavoritesStore.getState().pin(baseConfig(2, ["#112233", "#445566", "#778899", "#bbccdd"]));
    });
    render(<FavoritesStrip />);
    const items = screen.getAllByLabelText(/load favorite wallpaper/i);
    expect(items).toHaveLength(2);
  });

  it("clicking a thumbnail loads its config into the ConfigStore", async () => {
    const targetColors: Colors4 = ["#abcdef", "#fedcba", "#012345", "#543210"];
    act(() => {
      useFavoritesStore.getState().pin(baseConfig(999, targetColors));
    });
    const user = userEvent.setup();
    render(<FavoritesStrip />);
    await user.click(screen.getByLabelText(/load favorite wallpaper/i));
    expect(useConfigStore.getState().colors).toEqual(targetColors);
    expect(useConfigStore.getState().seed).toBe(999);
  });

  it("clicking the X removes the item from favorites", async () => {
    act(() => {
      useFavoritesStore.getState().pin(baseConfig(7, ["#000000", "#111111", "#222222", "#333333"]));
    });
    const user = userEvent.setup();
    render(<FavoritesStrip />);
    expect(useFavoritesStore.getState().items).toHaveLength(1);
    await user.click(screen.getByLabelText(/remove from favorites/i));
    expect(useFavoritesStore.getState().items).toHaveLength(0);
  });
});
