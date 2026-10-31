// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";
import { StudioInspector } from "./StudioInspector";

const INITIAL = useConfigStore.getState();

function Harness({ keysActive = true }: { keysActive?: boolean }) {
  return <StudioInspector keysActive={keysActive} />;
}

/** The frame the inspector measures: narrow (phone) or wide. */
function stubFrameWidth(width: number) {
  class RO {
    constructor(private cb: ResizeObserverCallback) {}
    observe() {
      this.cb([{ contentRect: { width } } as ResizeObserverEntry], this as never);
    }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
}

describe("StudioInspector", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useFavoritesStore.getState().clear();
      useLookHistoryStore.getState().clear();
    });
    localStorage.clear();
  });

  it("shows every control at once on a wide frame: style, palettes, colors, sliders, save and download", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Style")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Palette" })).toBeTruthy();
    expect(screen.getAllByLabelText(/^colour [1-4]$/i)).toHaveLength(4);
    expect(screen.getByRole("slider", { name: "Grain" })).toBeTruthy();
    expect(screen.getByLabelText("Save this wallpaper")).toBeTruthy();
    expect(screen.getByRole("button", { name: /download/i })).toBeTruthy();
    // Nothing is hidden behind an Adjust toggle any more.
    expect(screen.queryByRole("button", { name: /^adjust$/i })).toBeNull();
  });

  it("offers one Style picker: six looks, each a style and a material", () => {
    render(<Harness />);
    const style = screen.getByLabelText("Style");
    const labels = Array.from(style.querySelectorAll("button")).map((b) => b.textContent);
    expect(labels).toEqual(["Glass", "Dots", "Pixel", "Mesh", "Aurora", "Liquid"]);
    expect(screen.queryByLabelText("Material")).toBeNull();
  });

  it("keeps the plain style switch for a favorite drawn by the v1 engine", () => {
    act(() => useConfigStore.setState({ engine: "v1" }));
    render(<Harness />);
    const style = screen.getByLabelText("Style");
    const labels = Array.from(style.querySelectorAll("button")).map((b) => b.textContent);
    expect(labels).toEqual(["Mesh", "Aurora", "Liquid"]);
  });

  it("on a phone-wide frame, groups the controls under Style, Colors and Adjust tabs", async () => {
    stubFrameWidth(390);
    try {
      const user = userEvent.setup();
      render(
        <div data-device="mobile">
          <Harness />
        </div>,
      );
      const tabs = screen.getByRole("tablist", { name: /controls/i });
      expect(
        within(tabs)
          .getAllByRole("tab")
          .map((t) => t.textContent),
      ).toEqual(["Style", "Colours", "Adjust"]);
      expect(screen.getByRole("group", { name: "Style" })).toBeTruthy();
      expect(screen.queryByRole("slider")).toBeNull();

      await user.click(within(tabs).getByRole("tab", { name: "Colours" }));
      expect(screen.getByLabelText("Palette Forest")).toBeTruthy();
      expect(screen.getAllByLabelText(/^colour [1-4]$/i)).toHaveLength(4);

      await user.click(within(tabs).getByRole("tab", { name: "Adjust" }));
      expect(screen.getByRole("slider", { name: "Grain" })).toBeTruthy();
      // Shuffle, save and download stay in reach whatever the tab.
      expect(screen.getByLabelText(/shuffle: generate another wallpaper/i)).toBeTruthy();
      expect(screen.getByLabelText("Save this wallpaper")).toBeTruthy();
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

  it("names the keys under Shuffle, only where there is a keyboard and mouse", () => {
    render(<Harness />);
    const legend = screen.getByTestId("studio-keys");
    expect(within(legend).getByText("Space").tagName).toBe("KBD");
    expect(within(legend).getByText("R").tagName).toBe("KBD");
    expect(legend).toHaveTextContent(/Space\s*Shuffle\s*R\s*Remix/);
    expect(legend.className).toContain("hidden");
    expect(legend.className).toContain("[@media(hover:hover)_and_(pointer:fine)]:flex");
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
    expect(screen.queryByText(/keep it with the heart/i)).toBeNull();
    await user.click(shuffle);
    expect(screen.getByText(/keep it with the heart/i)).toBeTruthy();
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

  it("a look sets both style and material, and shows as pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dots = screen.getByRole("button", { name: "Dots" });
    expect(screen.getByRole("button", { name: "Pixel" }).getAttribute("aria-pressed")).toBe("true");
    expect(dots.getAttribute("aria-pressed")).toBe("false");
    await user.click(dots);
    const s = useConfigStore.getState();
    expect([s.style, s.material]).toEqual(["liquid", "halftone"]);
    expect(dots.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Glass" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("picking a swatch applies that palette", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByLabelText("Palette Tokyo"));
    const tokyo = PALETTES.find((p) => p.name === "Tokyo")!;
    expect(useConfigStore.getState().colors).toEqual(tokyo.colors);
    expect(screen.getByLabelText("Palette Tokyo").getAttribute("aria-pressed")).toBe("true");
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

  it("shows the engine's sliders and Reset restores their defaults", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    // The v2 shader's look is calibrated: only grain and the turn are exposed.
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(screen.getByRole("slider", { name: "Rotate" })).toBeTruthy();

    act(() => useConfigStore.setState({ grain: 80, rotation: 90 }));
    await user.click(screen.getByRole("button", { name: /reset/i }));
    const s = useConfigStore.getState();
    expect([s.grain, s.rotation]).toEqual([45, 0]);
  });

  describe("going back to a previous wallpaper", () => {
    const back = () => screen.getByRole("button", { name: /previous wallpaper/i });
    const forward = () => screen.getByRole("button", { name: /next wallpaper/i });
    const isDisabled = (el: HTMLElement) => el.getAttribute("aria-disabled") === "true";

    it("both arrows start disabled: there is nothing before the first wallpaper", () => {
      render(<Harness />);
      expect(isDisabled(back())).toBe(true);
      expect(isDisabled(forward())).toBe(true);
    });

    it("an arrow at the end of the list does nothing and keeps keyboard focus", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      const seed = useConfigStore.getState().seed;
      back().focus();
      await user.keyboard("{Enter}");
      expect(useConfigStore.getState().seed).toBe(seed);
      expect(document.activeElement).toBe(back());
    });

    it("Shuffle then ‹ brings the wallpaper that was lost back, and › returns to the new one", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      const first = {
        colors: useConfigStore.getState().colors,
        seed: useConfigStore.getState().seed,
      };

      await user.click(screen.getByLabelText(/shuffle: generate another wallpaper/i));
      const second = {
        colors: useConfigStore.getState().colors,
        seed: useConfigStore.getState().seed,
      };
      expect(second.seed).not.toBe(first.seed);
      expect(isDisabled(back())).toBe(false);
      expect(isDisabled(forward())).toBe(true);

      await user.click(back());
      expect(useConfigStore.getState().seed).toBe(first.seed);
      expect(useConfigStore.getState().colors).toEqual(first.colors);
      expect(isDisabled(back())).toBe(true);
      expect(isDisabled(forward())).toBe(false);

      await user.click(forward());
      expect(useConfigStore.getState().seed).toBe(second.seed);
      expect(useConfigStore.getState().colors).toEqual(second.colors);
    });

    it("Space, R and a palette swatch each leave a step to go back to", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      const steps = () => useLookHistoryStore.getState().past.length;

      await user.keyboard(" ");
      expect(steps()).toBe(1);
      await user.keyboard("r");
      expect(steps()).toBe(2);
      await user.click(screen.getByLabelText("Palette Forest"));
      expect(steps()).toBe(3);
    });

    it("sliders do not fill the history: only gestures that replace the wallpaper do", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      act(() => useConfigStore.setState({ grain: 80 }));
      await user.click(screen.getByLabelText(/shuffle: generate another wallpaper/i));
      expect(useLookHistoryStore.getState().past).toHaveLength(1);
    });
  });
});
