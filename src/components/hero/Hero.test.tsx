// @vitest-environment jsdom
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";
import { Hero } from "./Hero";

// jsdom has no WebGL2, so the real ScreenMotion renders nothing; a stand-in shows where it goes.
vi.mock("../studio/v2/ScreenMotion", () => ({
  ScreenMotion: () => <canvas data-testid="screen-motion" />,
}));

const INITIAL = useConfigStore.getState();

describe("Hero", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useLookHistoryStore.setState({ past: [], future: [] });
    });
  });

  it("carries the page's only H1, in the lowercase display voice, under palette shapes", () => {
    const { getAllByRole, container } = render(<Hero />);
    const h1s = getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toMatch(/make a gradient wallpaper\.\s*shuffle until it's yours\./);
    expect(h1s[0].className).toMatch(/display-head/);
    expect(container.querySelector("[data-bauhaus-marks]")).not.toBeNull();
  });

  it("shows the live wallpaper inside the photographed phone", () => {
    const { getByRole, container } = render(<Hero />);
    const screen = getByRole("img", { name: /current wallpaper on a phone/i });
    expect(screen.querySelector("canvas")).not.toBeNull();
    const photo = container.querySelector("img[src='/assets/hero/phone.webp']");
    expect(photo).not.toBeNull();
    // The photo is decoration: the screen element already names what it shows.
    expect(photo?.getAttribute("alt")).toBe("");
  });

  it("moves the wallpaper on the phone screen, like the Studio's device", () => {
    const { getByRole, getByTestId } = render(<Hero />);
    const screen = getByRole("img", { name: /current wallpaper on a phone/i });
    expect(screen.contains(getByTestId("screen-motion"))).toBe(true);
  });

  it("measures the phone with rulers in the pixels a phone download has", () => {
    const { container } = render(<Hero />);
    const rulers = container.querySelector("[data-rulers]");
    expect(rulers?.getAttribute("aria-hidden")).toBe("true");
    expect(rulers?.textContent).toContain("1440 px");
    expect(rulers?.textContent).toContain("3200 px");
  });

  it("floats the phone only for visitors who allow motion", () => {
    const { container } = render(<Hero />);
    const float = container.querySelector("[data-float]");
    expect(float?.className).toMatch(/motion-safe:animate-float\b/);
    expect(float?.className).not.toMatch(/(^|\s)animate-/);
  });

  it("shuffles the wallpaper, and steps back to the previous one", () => {
    const { getByRole } = render(<Hero />);
    const before = useConfigStore.getState().seed;
    const back = getByRole("button", { name: /previous wallpaper/i });
    expect(back.getAttribute("aria-disabled")).toBe("true");

    fireEvent.click(getByRole("button", { name: /shuffle: generate another wallpaper/i }));
    expect(useConfigStore.getState().seed).not.toBe(before);
    expect(back.getAttribute("aria-disabled")).toBe("false");

    fireEvent.click(back);
    expect(useConfigStore.getState().seed).toBe(before);
  });

  it("names the palette on screen and follows it", () => {
    const { getByText } = render(<Hero />);
    act(() => useConfigStore.getState().setColors([...PALETTES[1].colors]));
    expect(getByText(PALETTES[1].name.toLowerCase())).toBeTruthy();
  });

  it("sends visitors who want more control down to the Studio", () => {
    const { getByRole } = render(<Hero />);
    expect(getByRole("link", { name: /customize it/i }).getAttribute("href")).toBe("#studio");
  });

  it("tells phone visitors what it costs and points to the packs", () => {
    const { getByText, getByRole } = render(<Hero />);
    const line = getByText(/free, up to 5K, no account, no watermark\./i);
    // On wider screens the column beside the phone already says it.
    expect(line.closest(".md\\:hidden")).not.toBeNull();
    const packs = getByRole("link", { name: /or get a hand-picked pack, €5\.99/i });
    expect(packs.getAttribute("href")).toBe("#packs");
    expect(packs.closest(".md\\:hidden")).not.toBeNull();
  });
});
