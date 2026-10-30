// @vitest-environment jsdom
import { act, fireEvent, render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";
import { useMotionStore } from "@/store/useMotionStore";
import { EngineProvider, webglEngine } from "../studio/engine";
import { Hero } from "./Hero";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

/** The links in it navigate, so it renders inside a router, as in the app. */
const render = (ui: ReactElement) => rtlRender(ui, { wrapper: MemoryRouter });

// jsdom has no WebGL2, so the real ScreenMotion renders nothing; a stand-in shows where it goes.
vi.mock("../studio/engine/ScreenMotion", () => ({
  ScreenMotion: () => <canvas data-testid="screen-motion" />,
}));

const INITIAL = useConfigStore.getState();

describe("Hero", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useLookHistoryStore.setState({ past: [], future: [] });
      useMotionStore.setState({ paused: false });
    });
  });

  it("carries the page's only H1, in the lowercase display voice, under palette shapes", () => {
    const { getAllByRole, container } = render(<Hero />);
    const h1s = getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    // A4 (2026-10-20): the H1 names the search term and the benefit; the old
    // promise stays right under it.
    expect(h1s[0].textContent).toMatch(/make a gradient wallpaper\.\s*free, in 5K\./);
    expect(h1s[0].nextElementSibling?.textContent).toMatch(/shuffle until it's yours\./);
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

  it("leaves the still wallpaper alone when the engine has no drifting layer", () => {
    const still = { ...webglEngine, Motion: undefined };
    const { queryByTestId } = render(
      <EngineProvider engine={still}>
        <Hero />
      </EngineProvider>,
    );
    expect(queryByTestId("screen-motion")).toBeNull();
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

  it("lets the visitor pause the floating phone where it is, and play it again", () => {
    const { container, getByRole } = render(<Hero />);
    const float = () => container.querySelector("[data-float]")?.className ?? "";
    expect(float()).not.toMatch(/animation-play-state:paused/);
    fireEvent.click(getByRole("button", { name: "Pause motion" }));
    expect(useMotionStore.getState().paused).toBe(true);
    expect(float()).toMatch(/\[animation-play-state:paused\]/);
    fireEvent.click(getByRole("button", { name: "Play motion" }));
    expect(float()).not.toMatch(/animation-play-state:paused/);
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
    expect(getByRole("link", { name: /customise it/i }).getAttribute("href")).toBe("/#studio");
  });

  it("shows phone visitors both packs under the shuffle, each linking to its page", () => {
    const { getByRole } = render(<Hero />);
    const group = getByRole("region", { name: /or get a hand-picked pack · €5\.99/i });
    // On wider screens the packs section shows right under the hero.
    expect(group.closest(".md\\:hidden")).not.toBeNull();
    const impasto = getByRole("link", { name: /impasto.*10 designs/i });
    expect(impasto.getAttribute("href")).toBe("/packs/impasto/");
    expect(getByRole("link", { name: /dessau.*6 designs/i }).getAttribute("href")).toBe(
      "/packs/dessau/",
    );
  });

  it("shows a pack piece on every fifth shuffle, with a link to its pack", () => {
    const { getByRole, queryByRole } = render(<Hero />);
    const shuffle = getByRole("button", { name: /shuffle: generate another wallpaper/i });
    const peekLink = () => queryByRole("link", { name: /from the .* pack/i });
    for (let i = 0; i < 4; i++) fireEvent.click(shuffle);
    expect(peekLink()).toBeNull();

    fireEvent.click(shuffle);
    expect(peekLink()?.textContent).toMatch(/from the impasto pack · see all 10/i);
    expect(peekLink()?.getAttribute("href")).toBe("/packs/impasto/");
    const screen = getByRole("img", { name: /on a phone/i });
    expect(screen.querySelector("img")?.getAttribute("alt")).toMatch(/acrylic/i);

    fireEvent.click(shuffle);
    expect(peekLink()).toBeNull();
    expect(screen.querySelector("img:not([aria-hidden])")).toBeNull();
  });

  it("loads the next pack piece, hidden, from the first shuffle on", () => {
    const { getByRole } = render(<Hero />);
    const shuffle = getByRole("button", { name: /shuffle: generate another wallpaper/i });
    const screen = getByRole("img", { name: /on a phone/i });
    // A visitor who never shuffles downloads nothing extra.
    expect(screen.querySelector("img")).toBeNull();

    fireEvent.click(shuffle);
    const ahead = screen.querySelector("img");
    expect(ahead?.getAttribute("src")).toBe("/assets/packs/acrylic/01.jpg");
    expect(ahead?.getAttribute("loading")).toBe("eager");
    expect(ahead?.getAttribute("aria-hidden")).toBe("true");
    expect(ahead?.className).toMatch(/\bopacity-0\b/);

    for (let i = 0; i < 4; i++) fireEvent.click(shuffle);
    // The fifth shuffle shows that same image, so it is already there.
    expect(screen.querySelector("img")).toBe(ahead);
    expect(ahead?.getAttribute("aria-hidden")).toBeNull();
    expect(ahead?.className).not.toMatch(/\bopacity-0\b/);

    fireEvent.click(shuffle);
    expect(screen.querySelector("img")?.getAttribute("src")).toMatch(/dessau\/01_kreise/);
  });

  it("drops the pack piece when the visitor steps back to a gradient", () => {
    const { getByRole, queryByRole } = render(<Hero />);
    const shuffle = getByRole("button", { name: /shuffle: generate another wallpaper/i });
    for (let i = 0; i < 5; i++) fireEvent.click(shuffle);
    expect(queryByRole("link", { name: /from the .* pack/i })).not.toBeNull();
    fireEvent.click(getByRole("button", { name: /previous wallpaper/i }));
    expect(queryByRole("link", { name: /from the .* pack/i })).toBeNull();
  });
});
