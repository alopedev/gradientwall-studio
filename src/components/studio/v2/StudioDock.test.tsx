// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { StudioDock } from "./StudioDock";

const INITIAL = useConfigStore.getState();

function Harness({ keysActive = true }: { keysActive?: boolean }) {
  // Adjust open state is owned by the shell; mimic it here.
  return <DockWithState keysActive={keysActive} />;
}

import { useState } from "react";
function DockWithState({ keysActive }: { keysActive: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <StudioDock
      adjustOpen={open}
      onToggleAdjust={() => setOpen((o) => !o)}
      keysActive={keysActive}
    />
  );
}

describe("StudioDock", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useFavoritesStore.getState().clear();
    });
    localStorage.clear();
  });

  it("opens Adjust as a bottom sheet on a narrow frame, with a way to close it", async () => {
    class Narrow {
      constructor(private cb: ResizeObserverCallback) {}
      observe() {
        this.cb([{ contentRect: { width: 390 } } as ResizeObserverEntry], this as never);
      }
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("ResizeObserver", Narrow);
    try {
      const user = userEvent.setup();
      render(
        <div data-device="mobile">
          <Harness />
        </div>,
      );
      await user.click(screen.getByRole("button", { name: /^adjust$/i }));
      const sheet = screen.getByRole("dialog", { name: "Adjust" });
      expect(sheet.parentElement).toBe(document.body);
      expect(screen.getAllByRole("slider").length).toBeGreaterThan(0);
      await user.click(screen.getByRole("button", { name: /close adjust/i }));
      expect(screen.queryByRole("dialog", { name: "Adjust" })).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("cues Shuffle with a sweep until the first shuffle", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const shuffle = screen.getByLabelText(/shuffle: generate another wallpaper/i);
    expect(shuffle.className).toContain("gws-nudge");
    await user.click(shuffle);
    expect(shuffle.className).not.toContain("gws-nudge");
  });

  it("does not cue Shuffle while the studio is off screen", () => {
    render(<Harness keysActive={false} />);
    expect(screen.getByLabelText(/shuffle: generate another wallpaper/i).className).not.toContain(
      "gws-nudge",
    );
  });

  it("points at the heart after three shuffles, once", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const shuffle = screen.getByLabelText(/shuffle: generate another wallpaper/i);
    await user.click(shuffle);
    await user.click(shuffle);
    expect(screen.queryByText(/tap the heart to keep it/i)).toBeNull();
    await user.click(shuffle);
    expect(screen.getByText(/tap the heart to keep it/i)).toBeTruthy();
    expect(localStorage.getItem("gw:hint:heart")).toBe("1");
  });

  it("Shuffle changes the seed and keeps the chosen style", async () => {
    const user = userEvent.setup();
    act(() => useConfigStore.getState().setStyle("aurora"));
    render(<Harness />);
    const before = useConfigStore.getState().seed;
    await user.click(screen.getByLabelText(/shuffle: generate another wallpaper/i));
    expect(useConfigStore.getState().seed).not.toBe(before);
    expect(useConfigStore.getState().style).toBe("aurora");
  });

  it("Space shuffles when the studio is on screen and focus is not on a control", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const before = useConfigStore.getState().seed;
    await user.keyboard(" ");
    expect(useConfigStore.getState().seed).not.toBe(before);
  });

  it("Space does nothing while the studio is off screen", async () => {
    const user = userEvent.setup();
    render(<Harness keysActive={false} />);
    const before = useConfigStore.getState().seed;
    await user.keyboard(" ");
    expect(useConfigStore.getState().seed).toBe(before);
  });

  it("the style control updates the store and its pressed state", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const aurora = screen.getByRole("button", { name: "Aurora" });
    expect(aurora.getAttribute("aria-pressed")).toBe("false");
    await user.click(aurora);
    expect(useConfigStore.getState().style).toBe("aurora");
    expect(aurora.getAttribute("aria-pressed")).toBe("true");
  });

  it("picking a swatch applies that palette", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByLabelText("Palette Forest"));
    const forest = PALETTES.find((p) => p.name === "Forest")!;
    expect(useConfigStore.getState().colors).toEqual(forest.colors);
    expect(screen.getByLabelText("Palette Forest").getAttribute("aria-pressed")).toBe("true");
  });

  it("the heart saves the wallpaper and a second tap removes it", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const heart = screen.getByLabelText("Save this wallpaper");
    await user.click(heart);
    expect(useFavoritesStore.getState().items).toHaveLength(1);
    expect(heart.getAttribute("aria-pressed")).toBe("true");
    await user.click(heart);
    expect(useFavoritesStore.getState().items).toHaveLength(0);
    expect(heart.getAttribute("aria-pressed")).toBe("false");
  });

  it("Adjust opens the sliders and Reset restores the engine defaults", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const adjust = screen.getByRole("button", { name: /adjust/i });
    expect(adjust.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("slider", { name: "Grain" })).toBeNull();

    await user.click(adjust);
    expect(adjust.getAttribute("aria-expanded")).toBe("true");
    expect(await screen.findByRole("slider", { name: "Grain" })).toBeTruthy();
    // The v2 shader's look is calibrated: only grain and light are exposed.
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(screen.getByRole("slider", { name: "Light" })).toBeTruthy();

    act(() => useConfigStore.setState({ grain: 80, lightAngle: 90 }));
    await user.click(screen.getByRole("button", { name: /reset/i }));
    const s = useConfigStore.getState();
    expect([s.grain, s.lightAngle]).toEqual([45, 315]);
  });
});
