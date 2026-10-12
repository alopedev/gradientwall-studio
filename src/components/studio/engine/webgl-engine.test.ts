// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { V2Renderer } from "@/lib/gradient-v2";
import type { RenderParams } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import type { WallpaperEngine } from "./types";

vi.mock("@/lib/download/encode", () => ({
  encodeWithFallback: vi.fn(async () => ({ blob: new Blob(["x"]), ext: "webp" })),
  exportFormatLabel: vi.fn(() => "WebP"),
}));

import { createWebGLEngine } from "./webgl-engine";

const v2: RenderParams = {
  engine: "v2",
  colors: ["#101010", "#334455", "#aa5533", "#f0e0d0"],
  style: "aurora",
  blur: 48,
  grain: 45,
  seed: 0xa47b,
  lightAngle: 315,
};
const v1: RenderParams = { ...v2, engine: undefined, style: "mesh", grain: 32 };

/** jsdom has no 2D context; give target canvases a drawImage. */
function stubCanvas2D() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D,
  );
}

function setup(opts: { supported?: boolean; drawThrows?: boolean } = {}) {
  const draw = vi.fn(() => {
    if (opts.drawThrows) throw new Error("driver says no");
  });
  const renderer: V2Renderer = {
    canvas: document.createElement("canvas"),
    draw,
    isContextLost: () => false,
    isReady: () => true,
  };
  const fallback = {
    adjustmentsFor: vi.fn(),
    paintThumbnail: vi.fn(),
    exportWallpaper: vi.fn(async () => ({ filename: "v1.webp", bytes: 1 })),
  } as unknown as WallpaperEngine;
  const sink = vi.fn(async () => undefined);
  const engine = createWebGLEngine({
    sink,
    fallback,
    supported: () => opts.supported ?? true,
    renderer: () => renderer,
  });
  return { engine, draw, fallback, sink };
}

describe("webgl v2 engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    stubCanvas2D();
  });

  it("tells the Download button which format the file will have", () => {
    const { engine } = setup();
    expect(engine.exportFormat()).toBe("WebP");
  });

  it("declares grain and light only, with defaults matching the store's start", () => {
    const { engine } = setup();
    const store = useConfigStore.getState();
    const adjustments = engine.adjustmentsFor(v2);
    expect(adjustments.map((a) => a.key)).toEqual(["grain", "lightAngle"]);
    for (const spec of adjustments) expect(spec.default, spec.key).toBe(store[spec.key]);
    expect(engine.styles.map((s) => s.id)).toEqual(["mesh", "aurora", "liquid"]);
  });

  it("hands the sliders of a v1 favorite to the v1 engine", () => {
    const { engine, fallback } = setup();
    const v1Sliders = [{ key: "blur" }] as never;
    vi.mocked(fallback.adjustmentsFor).mockReturnValue(v1Sliders);
    expect(engine.adjustmentsFor(v1)).toBe(v1Sliders);
    expect(fallback.adjustmentsFor).toHaveBeenCalledWith(v1);
    expect(engine.adjustmentsFor(v2).map((a) => a.key)).toEqual(["grain", "lightAngle"]);
  });

  it("paints v2 thumbnails with the shader", () => {
    const { engine, draw, fallback } = setup();
    engine.paintThumbnail(document.createElement("canvas"), v2, { w: 88, h: 152 });
    expect(draw).toHaveBeenCalledWith(
      { colors: v2.colors, style: "aurora", seed: v2.seed, lightAngle: 315, grain: 45 },
      88,
      152,
      {},
    );
    expect(fallback.paintThumbnail).not.toHaveBeenCalled();
  });

  it("keeps favorites saved with v1 on the v1 engine", async () => {
    const { engine, draw, fallback } = setup();
    engine.paintThumbnail(document.createElement("canvas"), v1, { w: 88, h: 152 });
    await engine.exportWallpaper(v1, "mobile");
    expect(draw).not.toHaveBeenCalled();
    expect(fallback.paintThumbnail).toHaveBeenCalledOnce();
    expect(fallback.exportWallpaper).toHaveBeenCalledWith(v1, "mobile", undefined);
  });

  it("falls back to v1 when the GPU path fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { engine, fallback } = setup({ drawThrows: true });
    engine.paintThumbnail(document.createElement("canvas"), v2, { w: 88, h: 152 });
    await engine.exportWallpaper(v2, "desktop");
    expect(fallback.paintThumbnail).toHaveBeenCalledOnce();
    expect(fallback.exportWallpaper).toHaveBeenCalledOnce();
  });

  it("falls back to v1 without WebGL2", () => {
    const { engine, draw, fallback } = setup({ supported: false });
    engine.paintThumbnail(document.createElement("canvas"), v2, { w: 88, h: 152 });
    expect(draw).not.toHaveBeenCalled();
    expect(fallback.paintThumbnail).toHaveBeenCalledOnce();
  });

  it("exports v2 at the device size in strips and saves it", async () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    const { engine, draw, sink } = setup();
    const progress: number[] = [];
    const result = await engine.exportWallpaper(v2, "desktop", (p) => progress.push(p));
    expect(draw).toHaveBeenCalledWith(expect.anything(), 5120, 2880, { strip: 512 });
    expect(sink).toHaveBeenCalledOnce();
    expect(result.filename).toBe("gradientwall-desktop-A47B.webp");
    expect(progress.at(-1)).toBe(1);
    vi.unstubAllGlobals();
  });
});
