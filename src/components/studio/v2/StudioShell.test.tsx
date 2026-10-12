// @vitest-environment jsdom
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfigStore } from "@/store";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { StudioShell } from "./StudioShell";

// jsdom never reports a section as visible; the shell only arms Space and R while it is.
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useInView: () => true,
}));

const INITIAL = useConfigStore.getState();

const pressSpace = () => {
  const ev = new KeyboardEvent("keydown", {
    code: "Space",
    key: " ",
    bubbles: true,
    cancelable: true,
  });
  document.body.dispatchEvent(ev);
  return ev;
};

describe("StudioShell", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useFavoritesStore.getState().clear();
    });
    localStorage.clear();
  });

  it("renders the studio landmark with its controls and the saved strip", () => {
    const { container, getByLabelText, getByRole } = render(<StudioShell />);

    expect(container.querySelector("#studio")).not.toBeNull();
    expect(getByRole("toolbar", { name: /wallpaper controls/i })).toBeTruthy();
    // Every control lives in one panel beside the wallpaper.
    expect(getByRole("complementary", { name: /studio controls/i })).toBeTruthy();
    expect(getByLabelText(/shuffle: generate another wallpaper/i)).toBeTruthy();
    expect(getByLabelText("Device")).toBeTruthy();
    expect(getByLabelText("Style")).toBeTruthy();
    expect(getByLabelText("Palette")).toBeTruthy();
    expect(getByLabelText(/favorites — empty/i)).toBeTruthy();
  });

  it("paints the wallpaper into a framed screen", () => {
    const { container, getByRole } = render(<StudioShell />);
    expect(getByRole("img", { name: /wallpaper preview/i })).toBeTruthy();
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("is the first screen: it carries the page's only H1, with the pitch", () => {
    const { getAllByRole, getByRole } = render(<StudioShell />);
    expect(getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(getByRole("heading", { level: 1 }).textContent).toMatch(
      /make your own gradient\s+wallpaper\./i,
    );
  });

  it("keeps the #studio anchor on the frame, so the nav link lands on the dock", () => {
    const { container, getByRole } = render(<StudioShell />);
    const anchor = container.querySelector("#studio");
    expect(anchor?.contains(getByRole("toolbar", { name: /wallpaper controls/i }))).toBe(true);
    expect(anchor?.contains(getByRole("img", { name: /wallpaper preview/i }))).toBe(true);
    // The hero is no longer a separate section: nothing before the studio plays video.
    expect(container.querySelector("video")).toBeNull();
  });

  it("leaves Space alone (the page scrolls) until the pointer or focus is in the studio", () => {
    const { container, getByLabelText } = render(<StudioShell />);
    const frame = container.querySelector("[data-device]") as HTMLElement;
    const seed = useConfigStore.getState().seed;

    // Page-level Space: not ours, so the browser keeps scrolling.
    const idle = pressSpace();
    expect(idle.defaultPrevented).toBe(false);
    expect(useConfigStore.getState().seed).toBe(seed);

    // Pointer over the frame arms the shortcuts.
    fireEvent.pointerEnter(frame);
    const hovered = pressSpace();
    expect(hovered.defaultPrevented).toBe(true);
    expect(useConfigStore.getState().seed).not.toBe(seed);

    // Pointer leaves: disarmed again.
    fireEvent.pointerLeave(frame);
    expect(pressSpace().defaultPrevented).toBe(false);

    // Focus inside the frame arms them too, and leaving focus disarms them.
    fireEvent.focus(getByLabelText("Palette").querySelector("button") as HTMLElement);
    expect(pressSpace().defaultPrevented).toBe(true);
    fireEvent.blur(getByLabelText("Palette").querySelector("button") as HTMLElement, {
      relatedTarget: document.body,
    });
    expect(pressSpace().defaultPrevented).toBe(false);
  });

  it("lights the first screen with the current palette", () => {
    act(() => useConfigStore.getState().setColors(["#112233", "#445566", "#778899", "#aabbcc"]));
    const { container } = render(<StudioShell />);
    const ambient = container.querySelector("section > [aria-hidden='true']") as HTMLElement;
    expect(ambient).not.toBeNull();
    // jsdom serialises colors as rgb().
    expect(ambient.innerHTML).toContain("17, 34, 51");
  });
});
