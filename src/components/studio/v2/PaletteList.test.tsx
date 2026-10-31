// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";
import { PaletteList } from "./PaletteList";

const INITIAL = useConfigStore.getState();

describe("PaletteList", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useLookHistoryStore.getState().clear();
    });
  });

  it("shows four palettes in one row and opens them all by name", async () => {
    const user = userEvent.setup();
    render(<PaletteList />);
    const group = screen.getByRole("group", { name: "Palette" });
    expect(group.querySelectorAll("button")).toHaveLength(4);
    await user.click(
      screen.getByRole("button", { name: new RegExp(`all ${PALETTES.length}`, "i") }),
    );
    expect(group.querySelectorAll("button")).toHaveLength(PALETTES.length);
    for (const p of PALETTES)
      expect(screen.getByLabelText(`Palette ${p.name}`).textContent).toBe(p.name);
    await user.click(screen.getByRole("button", { name: /less/i }));
    expect(group.querySelectorAll("button")).toHaveLength(4);
  });

  it("keeps a hidden palette in use in view when closed", () => {
    const cherry = PALETTES.find((p) => p.name === "Cherry")!;
    act(() => useConfigStore.getState().setColors(cherry.colors));
    render(<PaletteList />);
    const group = screen.getByRole("group", { name: "Palette" });
    expect(group.querySelectorAll("button")).toHaveLength(4);
    expect(screen.getByLabelText("Palette Cherry").getAttribute("aria-pressed")).toBe("true");
  });

  it("marks the palette in use and applies another one, leaving a step to go back to", async () => {
    const user = userEvent.setup();
    const ember = PALETTES.find((p) => p.name === "Ember")!;
    act(() => useConfigStore.getState().setColors(ember.colors));
    render(<PaletteList />);
    expect(screen.getByLabelText("Palette Ember").getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByLabelText("Palette Forest"));
    const forest = PALETTES.find((p) => p.name === "Forest")!;
    expect(useConfigStore.getState().colors).toEqual(forest.colors);
    expect(screen.getByLabelText("Palette Forest").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Palette Ember").getAttribute("aria-pressed")).toBe("false");
    expect(useLookHistoryStore.getState().past).toHaveLength(1);
  });
});
