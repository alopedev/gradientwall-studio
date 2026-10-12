// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as v2 from "@/lib/gradient-v2";
import { BACKDROP_MIN_FRAME_MS, screenMotionSize } from "@/lib/gradient-v2";
import type { Colors4, RenderParams } from "@/lib/palettes";
import { SCREEN_MOTION_HOLD_MS, ScreenMotion } from "./ScreenMotion";

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

const A: Colors4 = ["#112233", "#445566", "#778899", "#aabbcc"];
const B: Colors4 = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];
const LOOK: RenderParams = {
  colors: A,
  style: "mesh",
  blur: 0,
  seed: 42,
  grain: 30,
  lightAngle: 200,
  engine: "v2",
};

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
let ready = true;
/** When set, idle callbacks wait here instead of running at once. */
let idleQueue: (() => void)[] | null = null;

function setMotion(reduce: boolean) {
  (window.matchMedia as unknown as ReturnType<typeof vi.fn>).mockImplementation((q: string) => ({
    matches: reduce && q.includes("prefers-reduced-motion"),
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  gpu.inView = true;
  gpu.supported = true;
  lost = false;
  ready = true;
  frames = new Map();
  clock = 1000;
  draw = vi.fn();
  gpu.create.mockReset();
  gpu.create.mockImplementation(() => ({
    canvas: document.createElement("canvas"),
    draw,
    isContextLost: () => lost,
    isReady: () => ready,
  }));
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.set(nextId, cb);
    return nextId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => void frames.delete(id));
  idleQueue = null;
  vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
    if (idleQueue) idleQueue.push(cb);
    else cb();
    return 1;
  });
  vi.stubGlobal("cancelIdleCallback", () => undefined);
  setMotion(false);
  Object.defineProperty(navigator, "connection", { value: undefined, configurable: true });
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
});

afterEach(() => vi.unstubAllGlobals());

/** The screen box is 300 x 600 CSS px at DPR 1. */
function renderMotion(params: RenderParams = LOOK) {
  const view = render(<ScreenMotion params={params} />);
  const canvas = view.container.querySelector("canvas");
  if (canvas) {
    Object.defineProperty(canvas, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(canvas, "clientHeight", { value: 600, configurable: true });
  }
  return view;
}
const opaque = (c: HTMLCanvasElement | null) => !c?.className.includes("opacity-0");

describe("ScreenMotion", () => {
  it("renders nothing without WebGL2: the still wallpaper stays on its own", () => {
    gpu.supported = false;
    const { container } = renderMotion();
    expect(container.firstElementChild).toBeNull();
    expect(gpu.create).not.toHaveBeenCalled();
  });

  it("renders nothing when the visitor prefers reduced motion", () => {
    setMotion(true);
    expect(renderMotion().container.firstElementChild).toBeNull();
  });

  it("renders nothing when the visitor asked to save data", () => {
    Object.defineProperty(navigator, "connection", {
      value: { saveData: true },
      configurable: true,
    });
    expect(renderMotion().container.firstElementChild).toBeNull();
  });

  it("leaves favorites saved with the v1 engine still: the shader would draw them differently", () => {
    const { container } = renderMotion({ ...LOOK, engine: "v1" });
    expect(container.firstElementChild).toBeNull();
  });

  it("is decorative: hidden from assistive tech and never catches the pointer", () => {
    const canvas = renderMotion().container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
    expect(canvas.className).toContain("pointer-events-none");
  });

  it("starts at t = 0 with the animated shader and the wallpaper's own look, at screen size", () => {
    const canvas = renderMotion().container.querySelector("canvas");
    tick(16);
    expect(gpu.create).toHaveBeenCalledWith(canvas, { animated: true });
    const [params, w, h, opts] = draw.mock.calls[0];
    expect(params).toMatchObject({
      colors: A,
      style: "mesh",
      seed: 42,
      grain: 30,
      lightAngle: 200,
    });
    expect({ width: w, height: h }).toEqual(screenMotionSize(300, 600, window.devicePixelRatio));
    expect(opts.time).toBe(0);
  });

  it("shows itself only after the first frame and the reveal's time, so the swap is invisible", () => {
    const canvas = renderMotion().container.querySelector("canvas");
    expect(opaque(canvas)).toBe(false);
    tick(16);
    expect(opaque(canvas)).toBe(false);
    for (let t = 0; t < SCREEN_MOTION_HOLD_MS; t += 40) tick(40);
    expect(opaque(canvas)).toBe(true);
  });

  it("keeps drifting, capped at about 30 fps", () => {
    renderMotion();
    tick(16);
    tick(5);
    expect(draw).toHaveBeenCalledTimes(1);
    tick(BACKDROP_MIN_FRAME_MS + 1);
    expect(draw).toHaveBeenCalledTimes(2);
    for (let t = 0; t < SCREEN_MOTION_HOLD_MS + 100; t += 40) tick(40);
    const a = draw.mock.calls.at(-2)?.[3].time as number;
    const b = draw.mock.calls.at(-1)?.[3].time as number;
    expect(b).toBeGreaterThan(a);
  });

  it("hides on a new wallpaper and starts again from t = 0 with it, so the reveal plays underneath", () => {
    const view = renderMotion();
    const canvas = view.container.querySelector("canvas");
    for (let t = 0; t < SCREEN_MOTION_HOLD_MS + 200; t += 40) tick(40);
    expect(opaque(canvas)).toBe(true);
    view.rerender(<ScreenMotion params={{ ...LOOK, colors: B }} />);
    expect(opaque(canvas)).toBe(false);
    tick(40);
    const [params, , , opts] = draw.mock.calls.at(-1) ?? [];
    expect(params.colors).toEqual(B);
    expect(opts.time).toBe(0);
    for (let t = 0; t < SCREEN_MOTION_HOLD_MS; t += 40) tick(40);
    expect(opaque(canvas)).toBe(true);
  });

  it("stops drawing while the Studio is out of view", () => {
    gpu.inView = false;
    renderMotion();
    tick(100);
    expect(draw).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("pauses while the tab is hidden and resumes when it is back", () => {
    renderMotion();
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(frames.size).toBe(0);
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(frames.size).toBe(1);
  });

  it("does not jump in time after a pause", () => {
    renderMotion();
    tick(16);
    tick(BACKDROP_MIN_FRAME_MS + 1);
    const before = draw.mock.calls.at(-1)?.[3].time as number;
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    clock += 60_000;
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    tick(BACKDROP_MIN_FRAME_MS + 1);
    expect((draw.mock.calls.at(-1)?.[3].time as number) - before).toBeLessThan(1);
  });

  it("cancels its frame on unmount", () => {
    const { unmount } = renderMotion();
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
  });

  it("steps aside when the GPU path throws, the renderer can't be made or the context is lost", () => {
    draw.mockImplementation(() => {
      throw new v2.WebGL2UnavailableError("clamped");
    });
    const a = renderMotion();
    tick(16);
    expect(a.container.firstElementChild).toBeNull();
    a.unmount();

    gpu.create.mockImplementation(() => {
      throw new v2.WebGL2UnavailableError();
    });
    expect(renderMotion().container.firstElementChild).toBeNull();
  });

  it("steps aside when the GPU context is lost", () => {
    const { container } = renderMotion();
    tick(16);
    lost = true;
    tick(BACKDROP_MIN_FRAME_MS + 1);
    expect(container.firstElementChild).toBeNull();
  });

  it("waits for the browser to be idle before creating its GPU context, so the still paints first", () => {
    idleQueue = [];
    renderMotion();
    expect(gpu.create).not.toHaveBeenCalled();
    act(() => {
      for (const cb of idleQueue ?? []) cb();
    });
    expect(gpu.create).toHaveBeenCalledTimes(1);
  });

  it("doesn't draw while the shader is still compiling", () => {
    ready = false;
    renderMotion();
    tick(16);
    expect(draw).not.toHaveBeenCalled();
    ready = true;
    tick(16);
    expect(draw.mock.calls[0][3].time).toBe(0);
  });
});
