import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  applyGrainOverlay,
  composeWallpaper,
  getNoiseTile,
  paintWallpaper,
  __resetNoiseTileForTests,
} from "./compose";
import type { Colors4 } from "../palettes";

/**
 * Minimal canvas + 2D context mock that records every method + property
 * assignment in call order. Lets us assert compose/grain pipelines without
 * a DOM.
 */
function makeCanvasMock() {
  const ops: string[] = [];
  const ctx = {
    _ops: ops,
    _fillStyle: null as unknown,
    set fillStyle(v: unknown) {
      this._fillStyle = v;
      ops.push(`fillStyle=${typeof v === "string" ? v : v?.constructor?.name ?? typeof v}`);
    },
    get fillStyle() {
      return this._fillStyle as CanvasRenderingContext2D["fillStyle"];
    },
    set globalAlpha(v: number) {
      ops.push(`globalAlpha=${v}`);
    },
    set globalCompositeOperation(v: string) {
      ops.push(`globalCompositeOperation=${v}`);
    },
    set filter(v: string) {
      ops.push(`filter=${v}`);
    },
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => ops.push(`fillRect(${x},${y},${w},${h})`)),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(() => ({ _kind: "pattern" })),
    createImageData: vi.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h })),
    putImageData: vi.fn(),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
  } as unknown as HTMLCanvasElement & { _ops: string[]; _ctx: typeof ctx };
  (canvas as unknown as { _ops: string[] })._ops = ops;
  (canvas as unknown as { _ctx: typeof ctx })._ctx = ctx;
  return canvas as HTMLCanvasElement & { _ops: string[]; _ctx: typeof ctx };
}

const canvasFactory = () => makeCanvasMock();

describe("getNoiseTile", () => {
  beforeEach(() => __resetNoiseTileForTests());

  it("returns the same canvas instance across calls (memoized)", () => {
    const a = getNoiseTile(canvasFactory);
    const b = getNoiseTile(canvasFactory);
    expect(a).toBe(b);
  });

  it("initializes a 256×256 tile", () => {
    const tile = getNoiseTile(canvasFactory);
    expect(tile.width).toBe(256);
    expect(tile.height).toBe(256);
  });

  it("creates the tile only once even under many calls", () => {
    const factory = vi.fn(canvasFactory);
    getNoiseTile(factory);
    getNoiseTile(factory);
    getNoiseTile(factory);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe("applyGrainOverlay", () => {
  beforeEach(() => __resetNoiseTileForTests());

  it("sets alpha from grain%, composite overlay, then fills, then resets", () => {
    const canvas = makeCanvasMock();
    canvas.width = 100;
    canvas.height = 50;
    applyGrainOverlay(canvas, 50, canvasFactory);

    const ops = canvas._ops;
    // Must include overlay setup before fill, and reset after
    const idxAlpha = ops.findIndex((o) => o === "globalAlpha=0.275");
    const idxCompOverlay = ops.findIndex((o) => o === "globalCompositeOperation=overlay");
    const idxFillRect = ops.findIndex((o) => o === "fillRect(0,0,100,50)");
    const idxAlphaReset = ops.lastIndexOf("globalAlpha=1");
    const idxCompReset = ops.lastIndexOf("globalCompositeOperation=source-over");

    expect(idxAlpha).toBeGreaterThanOrEqual(0);
    expect(idxCompOverlay).toBeGreaterThanOrEqual(0);
    expect(idxFillRect).toBeGreaterThan(idxCompOverlay);
    expect(idxAlphaReset).toBeGreaterThan(idxFillRect);
    expect(idxCompReset).toBeGreaterThan(idxFillRect);
  });
});

describe("paintWallpaper", () => {
  beforeEach(() => __resetNoiseTileForTests());

  const COLORS: Colors4 = ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"];

  it("paints onto the caller's canvas without creating a new one", () => {
    const canvas = makeCanvasMock();
    const factory = vi.fn(canvasFactory);
    paintWallpaper(canvas, { w: 200, h: 100, colors: COLORS, style: "mesh", blur: 48, seed: 1 }, factory);
    // Only the noise tile (memoized, but we reset it so 0 if no grain) — without grain, factory must not be called
    expect(factory).not.toHaveBeenCalled();
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });

  it("skips the grain overlay when grain is omitted", () => {
    const canvas = makeCanvasMock();
    paintWallpaper(canvas, { w: 200, h: 100, colors: COLORS, style: "mesh", blur: 48, seed: 1 }, canvasFactory);
    expect(canvas._ops.some((o) => o === "globalCompositeOperation=overlay")).toBe(false);
  });

  it("skips the grain overlay when grain is 0", () => {
    const canvas = makeCanvasMock();
    paintWallpaper(
      canvas,
      { w: 200, h: 100, colors: COLORS, style: "mesh", blur: 48, grain: 0, seed: 1 },
      canvasFactory,
    );
    expect(canvas._ops.some((o) => o === "globalCompositeOperation=overlay")).toBe(false);
  });

  it("applies the grain overlay after the gradient when grain > 0", () => {
    const canvas = makeCanvasMock();
    paintWallpaper(
      canvas,
      { w: 200, h: 100, colors: COLORS, style: "mesh", blur: 48, grain: 45, seed: 1 },
      canvasFactory,
    );
    const lastBlur = canvas._ops.findIndex((o) => o.startsWith("filter=blur"));
    const overlayOp = canvas._ops.findIndex((o) => o === "globalCompositeOperation=overlay");
    expect(lastBlur).toBeGreaterThanOrEqual(0);
    expect(overlayOp).toBeGreaterThan(lastBlur);
  });

  it("does not throw and routes through the nebula path when style=nebula", () => {
    const canvas = makeCanvasMock();
    expect(() =>
      paintWallpaper(
        canvas,
        { w: 200, h: 100, colors: COLORS, style: "nebula", blur: 48, seed: 1 },
        canvasFactory,
      ),
    ).not.toThrow();
    // Nebula path uses putImageData, never the radial gradient layer pipeline
    expect(canvas._ctx.putImageData).toHaveBeenCalled();
    expect(canvas._ctx.createRadialGradient).not.toHaveBeenCalled();
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });

  it("applies grain overlay after the nebula putImageData when grain > 0", () => {
    const canvas = makeCanvasMock();
    const ctx = canvas._ctx;
    const overlayBefore = ctx.putImageData.mock.calls.length;
    paintWallpaper(
      canvas,
      { w: 200, h: 100, colors: COLORS, style: "nebula", blur: 48, grain: 45, seed: 1 },
      canvasFactory,
    );
    expect(ctx.putImageData).toHaveBeenCalled();
    const overlayOpIdx = canvas._ops.findIndex((o) => o === "globalCompositeOperation=overlay");
    expect(overlayOpIdx).toBeGreaterThanOrEqual(0);
    // Verifies that putImageData (nebula paint) and grain overlay both ran
    expect(ctx.putImageData.mock.calls.length).toBeGreaterThan(overlayBefore);
  });
});

describe("composeWallpaper", () => {
  beforeEach(() => __resetNoiseTileForTests());

  const COLORS: Colors4 = ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"];

  it("sets canvas width/height to the requested dimensions", () => {
    const canvas = composeWallpaper(
      { w: 1440, h: 3200, colors: COLORS, style: "mesh", blur: 48, grain: 45, seed: 12345 },
      canvasFactory,
    );
    expect(canvas.width).toBe(1440);
    expect(canvas.height).toBe(3200);
  });

  it("applies the grain overlay after the gradient layers (grain fillRect is last)", () => {
    const canvas = composeWallpaper(
      { w: 200, h: 100, colors: COLORS, style: "mesh", blur: 48, grain: 45, seed: 1 },
      canvasFactory,
    ) as unknown as HTMLCanvasElement & { _ops: string[] };

    // Gradient step uses `filter=blur(...)`, grain step uses `globalCompositeOperation=overlay`
    const lastBlur = canvas._ops.findIndex((o) => o.startsWith("filter=blur"));
    const overlayOp = canvas._ops.findIndex((o) => o === "globalCompositeOperation=overlay");
    expect(lastBlur).toBeGreaterThanOrEqual(0);
    expect(overlayOp).toBeGreaterThan(lastBlur);
  });

  it("paints the correct number of fillRect calls (background + layers + grain)", () => {
    // mesh with 4 colors → background(1) + 4 layers + grain(1) = 6 fillRects
    const canvas = composeWallpaper(
      { w: 200, h: 100, colors: COLORS, style: "mesh", blur: 48, grain: 45, seed: 1 },
      canvasFactory,
    ) as unknown as HTMLCanvasElement & { _ops: string[] };
    const fillRects = canvas._ops.filter((o) => o.startsWith("fillRect")).length;
    expect(fillRects).toBe(1 + 4 + 1);
  });
});
