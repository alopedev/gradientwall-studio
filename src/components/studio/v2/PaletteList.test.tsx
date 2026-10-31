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

  it("lists the ten palettes by name", () => {
    render(<PaletteList />);
    const group = screen.getByRole("group", { name: "Palette" });
    expect(group.querySelectorAll("button")).toHaveLength(PALETTES.length);
    for (const p of PALETTES)
      expect(screen.getByLabelText(`Palette ${p.name}`).textContent).toBe(p.name);
  });

  it("marks the palette in use and applies another one, leaving a step to go back to", async () => {
    const user = userEvent.setup();
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
