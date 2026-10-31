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

import { ScreenMotion } from "./ScreenMotion";
import { V1_ADJUSTMENTS } from "./v1-adjustments";
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
  const loadFallback = vi.fn(async () => fallback);
  const engine = createWebGLEngine({
    sink,
    loadFallback,
    supported: () => opts.supported ?? true,
    renderer: () => renderer,
  });
  return { engine, draw, fallback, sink, loadFallback };
}

describe("webgl v2 engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    stubCanvas2D();
  });

  it("offers the drifting screen layer (the hero and the Studio device show it)", () => {
    expect(setup().engine.Motion).toBe(ScreenMotion);
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

  it("gives a v1 favorite the v1 sliders without loading the v1 engine", () => {
    const { engine, loadFallback } = setup();
    expect(engine.adjustmentsFor(v1)).toBe(V1_ADJUSTMENTS);
    expect(engine.adjustmentsFor(v2).map((a) => a.key)).toEqual(["grain", "lightAngle"]);
    expect(loadFallback).not.toHaveBeenCalled();
  });

  it("loads the v1 engine only when something needs it, and only once", async () => {
    const { engine, loadFallback } = setup();
    await engine.paintThumbnail(document.createElement("canvas"), v2, { w: 88, h: 152 });
    expect(loadFallback).not.toHaveBeenCalled();
    await Promise.all([
      engine.paintThumbnail(document.createElement("canvas"), v1, { w: 88, h: 152 }),
      engine.paintThumbnail(document.createElement("canvas"), v1, { w: 88, h: 152 }),
    ]);
    engine.prefetch?.("v1");
    expect(loadFallback).toHaveBeenCalledOnce();
  });

  it("starts loading the download code ahead of a click", async () => {
    const loadExporter = vi.fn(async () => ({ exportV2: vi.fn(async () => null) }));
    const engine = createWebGLEngine({ loadExporter, loadFallback: vi.fn() });
    engine.prefetch?.("export");
    engine.prefetch?.("export");
    expect(loadExporter).toHaveBeenCalledOnce();
  });

  it("offers six looks for v2 wallpapers, ripple left out, and none for v1", () => {
    const { engine } = setup();
    expect(engine.looksFor?.(v2).map((o) => [o.label, o.style, o.material])).toEqual([
      ["Glass", "mesh", "fluted"],
      ["Dots", "liquid", "halftone"],
      ["Pixel", "mesh", "dither"],
      ["Mesh", "mesh", "none"],
      ["Aurora", "aurora", "none"],
      ["Liquid", "liquid", "none"],
    ]);
    expect(engine.looksFor?.(v1)).toEqual([]);
  });

  it("turns with Rotate; aurora, which can't turn, keeps Light", () => {
    const { engine } = setup();
    expect(engine.adjustmentsFor({ ...v2, style: "liquid" }).map((a) => a.key)).toEqual([
      "grain",
      "rotation",
    ]);
    expect(engine.adjustmentsFor({ ...v2, style: "aurora" }).map((a) => a.key)).toEqual([
      "grain",
      "lightAngle",
    ]);
  });

  it("passes the material to the shader", () => {
    const { engine, draw } = setup();
    engine.paintThumbnail(
      document.createElement("canvas"),
      { ...v2, material: "halftone" },
      {
        w: 88,
        h: 152,
      },
    );
    expect(draw).toHaveBeenCalledWith(
      expect.objectContaining({ material: "halftone" }),
      88,
      152,
      {},
    );
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
    await engine.paintThumbnail(document.createElement("canvas"), v1, { w: 88, h: 152 });
    await engine.exportWallpaper(v1, "mobile");
    expect(draw).not.toHaveBeenCalled();
    expect(fallback.paintThumbnail).toHaveBeenCalledOnce();
    expect(fallback.exportWallpaper).toHaveBeenCalledWith(v1, "mobile", undefined);
  });

  it("falls back to v1 when the GPU path fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { engine, fallback } = setup({ drawThrows: true });
    await engine.paintThumbnail(document.createElement("canvas"), v2, { w: 88, h: 152 });
    await engine.exportWallpaper(v2, "desktop");
    expect(fallback.paintThumbnail).toHaveBeenCalledOnce();
    expect(fallback.exportWallpaper).toHaveBeenCalledOnce();
  });

  it("falls back to v1 without WebGL2", async () => {
    const { engine, draw, fallback } = setup({ supported: false });
    await engine.paintThumbnail(document.createElement("canvas"), v2, { w: 88, h: 152 });
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

describe("what the first screen downloads", () => {
  it("keeps the v1 engine and the download code out of the engine's static imports", async () => {
    const { readFileSync } = await import("node:fs");
    const files = ["webgl-engine.tsx", "index.ts", "context.tsx"].map((f) =>
      readFileSync(`${process.cwd()}/src/components/studio/engine/${f}`, "utf8"),
    );
    const staticImports = files.flatMap((src) =>
      [...src.matchAll(/^import\s+(?!type\b)[^;]*?from\s+"([^"]+)"/gms)].map((m) => m[1]),
    );
    for (const heavy of [
      "./canvas2d-engine",
      "@/lib/download/compose",
      "@/lib/download/export",
      "@/lib/download/sink",
      "./webgl-export",
    ]) {
      expect(staticImports, heavy).not.toContain(heavy);
    }
  });
});
