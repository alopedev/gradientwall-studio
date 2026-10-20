// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { applyPalette, useConfigStore } from "@/store";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";
import { ColorEditor } from "./ColorEditor";

const INITIAL = useConfigStore.getState();
const DUSK = PALETTES[0];

const pick = (n: number, hex: string) =>
  fireEvent.change(screen.getByLabelText(`Colour ${n}`), { target: { value: hex } });

describe("ColorEditor", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useConfigStore.getState().setColors([...DUSK.colors]);
      useLookHistoryStore.getState().clear();
    });
    vi.unstubAllGlobals();
  });

  it("offers a color picker for each of the four colors, set to the current palette", () => {
    render(<ColorEditor onMessage={vi.fn()} />);
    const inputs = [1, 2, 3, 4].map(
      (n) => screen.getByLabelText(`Colour ${n}`) as HTMLInputElement,
    );
    expect(inputs.map((i) => i.type)).toEqual(["color", "color", "color", "color"]);
    expect(inputs.map((i) => i.value)).toEqual(DUSK.colors.map((c) => c.toLowerCase()));
  });

  it("picking a color repaints the wallpaper with it", () => {
    render(<ColorEditor onMessage={vi.fn()} />);
    pick(3, "#00ff88");
    expect(useConfigStore.getState().colors).toEqual([
      DUSK.colors[0],
      DUSK.colors[1],
      "#00ff88",
      DUSK.colors[3],
    ]);
    expect(screen.getByRole("button", { name: "Copy #00FF88" })).toBeTruthy();
  });

  it("a run of edits leaves one step in the history, not one per color", () => {
    render(<ColorEditor onMessage={vi.fn()} />);
    pick(1, "#111111");
    pick(1, "#222222");
    pick(2, "#333333");
    expect(useLookHistoryStore.getState().past).toHaveLength(1);
    expect(useLookHistoryStore.getState().past[0].colors).toEqual(DUSK.colors);
  });

  it("after an edit, offers a way back to the palette it started from", async () => {
    const user = userEvent.setup();
    render(<ColorEditor onMessage={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /back to/i })).toBeNull();

    pick(2, "#00ff88");
    await user.click(screen.getByRole("button", { name: "Back to Dusk" }));
    expect(useConfigStore.getState().colors).toEqual(DUSK.colors);
    expect(screen.queryByRole("button", { name: /back to/i })).toBeNull();
  });

  it("forgets the way back once another palette replaces the edited colors", () => {
    render(<ColorEditor onMessage={vi.fn()} />);
    pick(2, "#00ff88");
    act(() => applyPalette(3));
    expect(screen.queryByRole("button", { name: /back to/i })).toBeNull();
  });

  it("copies a color's hex code", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const onMessage = vi.fn();
    render(<ColorEditor onMessage={onMessage} />);
    await user.click(screen.getByRole("button", { name: `Copy ${DUSK.colors[0].toUpperCase()}` }));
    expect(writeText).toHaveBeenCalledWith(DUSK.colors[0].toUpperCase());
    expect(onMessage).toHaveBeenCalledWith(`Copied ${DUSK.colors[0].toUpperCase()}`);
  });
});
