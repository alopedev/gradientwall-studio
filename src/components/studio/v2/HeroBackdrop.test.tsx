// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as v2 from "@/lib/gradient-v2";
import { BACKDROP_MIN_FRAME_MS, BACKDROP_SEED } from "@/lib/gradient-v2";
import type { Colors4 } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { HeroBackdrop } from "./HeroBackdrop";

const gpu = vi.hoisted(() => ({ inView: true, supported: true, create: vi.fn() }));

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useInView: () => gpu.inView,
}));
vi.mock("@/lib/gradient-v2", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/gradient-v2")>()),
  isWebGL2Supported: () => gpu.supported,
  createRendererV2: gpu.create,
}));

const INITIAL = useConfigStore.getState();
const A: Colors4 = ["#112233", "#445566", "#778899", "#aabbcc"];
const B: Colors4 = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

// A hand-cranked requestAnimationFrame: nothing runs until the test says so.
let frames = new Map<number, FrameRequestCallback>();
let nextId = 1;
let clock = 0;
const tick = (ms: number) => {
  clock += ms;
  const due = [...frames.entries()];
  frames = new Map();
  act(() => {
    for (const [, cb] of due) cb(clock);
  });
};

let draw: ReturnType<typeof vi.fn>;
let lost = false;

function setMotion(reduce: boolean) {
  (window.matchMedia as unknown as ReturnType<typeof vi.fn>).mockImplementation((q: string) => ({
    matches: reduce && q.includes("prefers-reduced-motion"),
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  act(() => useConfigStore.setState(INITIAL, true));
  act(() => useConfigStore.getState().setColors(A));
  gpu.inView = true;
  gpu.supported = true;
  lost = false;
  frames = new Map();
  clock = 1000;
  draw = vi.fn();
  gpu.create.mockReset();
  gpu.create.mockImplementation(() => ({
    canvas: document.createElement("canvas"),
    draw,
    isContextLost: () => lost,
  }));
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.set(nextId, cb);
    return nextId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => void frames.delete(id));
  setMotion(false);
  Object.defineProperty(navigator, "connection", { value: undefined, configurable: true });
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
});

afterEach(() => vi.unstubAllGlobals());

const lastColors = () => draw.mock.calls.at(-1)?.[0].colors as string[];

describe("HeroBackdrop", () => {
  it("renders nothing without WebGL2: the CSS ambient stays on its own", () => {
    gpu.supported = false;
    const { container } = render(<HeroBackdrop />);
    expect(container.firstElementChild).toBeNull();
    expect(gpu.create).not.toHaveBeenCalled();
  });

  it("renders nothing when the visitor prefers reduced motion", () => {
    setMotion(true);
    const { container } = render(<HeroBackdrop />);
    expect(container.firstElementChild).toBeNull();
  });

  it("renders nothing when the visitor asked to save data", () => {
    Object.defineProperty(navigator, "connection", {
      value: { saveData: true },
      configurable: true,
    });
    const { container } = render(<HeroBackdrop />);
    expect(container.firstElementChild).toBeNull();
  });

  it("is decorative: hidden from assistive tech and never catches the pointer", () => {
    const { container } = render(<HeroBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.className).toContain("pointer-events-none");
    expect(root.querySelector("canvas")).not.toBeNull();
  });

  it("draws the first frame at t = 0 with the animated shader and the current palette", () => {
    const { container } = render(<HeroBackdrop />);
    tick(16);
    const canvas = container.querySelector("canvas");
    expect(gpu.create).toHaveBeenCalledWith(canvas, { animated: true });
    expect(draw).toHaveBeenCalledTimes(1);
    const [params, , , opts] = draw.mock.calls[0];
    expect(params).toMatchObject({ style: "liquid", seed: BACKDROP_SEED });
    expect(params.colors).toEqual(A);
    expect(opts.time).toBe(0);
  });

  it("fades in once the first frame is on screen", () => {
    const { container } = render(<HeroBackdrop />);
    expect(container.querySelector("canvas")?.className).toContain("opacity-0");
    tick(16);
    expect(container.querySelector("canvas")?.className).not.toContain("opacity-0");
  });

  it("keeps drifting, capped at about 30 fps", () => {
    render(<HeroBackdrop />);
    tick(16); // first frame
    tick(5); // too soon after it
    expect(draw).toHaveBeenCalledTimes(1);
    tick(BACKDROP_MIN_FRAME_MS + 1);
    expect(draw).toHaveBeenCalledTimes(2);
    expect(draw.mock.calls[1][3].time).toBeGreaterThan(0);
    tick(BACKDROP_MIN_FRAME_MS + 1);
    expect(draw.mock.calls[2][3].time).toBeGreaterThan(draw.mock.calls[1][3].time);
  });

  it("eases to the new palette after a Shuffle instead of jumping", () => {
    render(<HeroBackdrop />);
    tick(16);
    act(() => useConfigStore.getState().setColors(B));
    tick(50);
    expect(lastColors()).not.toEqual(A);
    expect(lastColors()).not.toEqual(B);
    for (let i = 0; i < 200; i++) tick(40);
    expect(lastColors()).toEqual(B);
  });

  it("stops drawing while the first screen is out of view", () => {
    gpu.inView = false;
    render(<HeroBackdrop />);
    tick(100);
    expect(draw).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("pauses while the tab is hidden and resumes when it is back", () => {
    render(<HeroBackdrop />);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(frames.size).toBe(0);
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(frames.size).toBe(1);
  });

  it("does not jump in time after a pause", () => {
    render(<HeroBackdrop />);
    tick(16);
    tick(BACKDROP_MIN_FRAME_MS + 1);
    const before = draw.mock.calls.at(-1)?.[3].time as number;
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    clock += 60_000; // a minute in another tab
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    tick(BACKDROP_MIN_FRAME_MS + 1);
    expect((draw.mock.calls.at(-1)?.[3].time as number) - before).toBeLessThan(1);
  });

  it("cancels its frame on unmount", () => {
    const { unmount } = render(<HeroBackdrop />);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
  });

  it("falls back to the CSS ambient when the GPU path throws", () => {
    draw.mockImplementation(() => {
      throw new v2.WebGL2UnavailableError("clamped");
    });
    const { container } = render(<HeroBackdrop />);
    tick(16);
    expect(container.firstElementChild).toBeNull();
    expect(frames.size).toBe(0);
  });

  it("falls back when the renderer can't be created", () => {
    gpu.create.mockImplementation(() => {
      throw new v2.WebGL2UnavailableError();
    });
    const { container } = render(<HeroBackdrop />);
    expect(container.firstElementChild).toBeNull();
  });

  it("falls back when the GPU context is lost", () => {
    const { container } = render(<HeroBackdrop />);
    tick(16);
    lost = true;
    tick(BACKDROP_MIN_FRAME_MS + 1);
    expect(container.firstElementChild).toBeNull();
  });
});
