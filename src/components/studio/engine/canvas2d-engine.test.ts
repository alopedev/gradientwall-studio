// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RenderParams } from "@/lib/palettes";

const composeWallpaper = vi.fn((_opts: unknown) => document.createElement("canvas"));
vi.mock("@/lib/download/compose", () => ({
  composeWallpaper: (opts: unknown) => composeWallpaper(opts),
  paintWallpaper: vi.fn(),
}));

import { createCanvas2DEngine } from "./canvas2d-engine";

const params: RenderParams = {
  colors: ["#101010", "#334455", "#aa5533", "#f0e0d0"],
  style: "liquid",
  blur: 60,
  grain: 40,
  seed: 0xa47b,
  lightAngle: 200,
  density: 0.6,
  contrast: 1.2,
  vibrance: 0.9,
};

describe("canvas2d engine", () => {
  beforeEach(() => composeWallpaper.mockClear());

  it("offers the three styles the dock shows", () => {
    const { styles } = createCanvas2DEngine(vi.fn());
    expect(styles.map((s) => s.id)).toEqual(["liquid", "aurora", "mesh"]);
  });

  it("declares adjustments with defaults inside their range", () => {
    const adjustments = createCanvas2DEngine(vi.fn()).adjustmentsFor(params);
    expect(adjustments.map((a) => a.key)).toEqual([
      "blur",
      "grain",
      "lightAngle",
      "contrast",
      "vibrance",
    ]);
    for (const spec of adjustments) {
      expect(spec.min).toBeLessThan(spec.max);
      expect(spec.default, spec.key).toBeGreaterThanOrEqual(spec.min);
      expect(spec.default, spec.key).toBeLessThanOrEqual(spec.max);
    }
  });

  it("exports at the device size with every render param, so the file matches the preview", async () => {
    const sink = vi.fn(async () => undefined);
    const engine = createCanvas2DEngine(sink);
    const progress: number[] = [];
    const result = await engine.exportWallpaper(params, "mobile", (p) => progress.push(p));

    expect(composeWallpaper).toHaveBeenCalledWith(
      expect.objectContaining({ ...params, w: 1440, h: 3200 }),
    );
    expect(sink).toHaveBeenCalledOnce();
    expect(result.filename).toBe("gradientwall-mobile-A47B.webp");
    expect(progress.at(-1)).toBe(1);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
  });
});
