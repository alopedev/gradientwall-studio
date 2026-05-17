import { describe, it, expect } from "vitest";
import { computeNebulaImageData, type NebulaParams } from "./nebula-render";

const baseParams = (overrides: Partial<NebulaParams> = {}): NebulaParams => ({
  w: 80,
  h: 60,
  colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"],
  seed: 12345,
  density: 0.5,
  ...overrides,
});

describe("computeNebulaImageData", () => {
  it("returns RGBA bytes covering w*h*4, every pixel fully opaque", () => {
    const out = computeNebulaImageData(baseParams());
    expect(out.length).toBe(80 * 60 * 4);
    let opaqueAlphaCount = 0;
    for (let i = 3; i < out.length; i += 4) if (out[i] === 255) opaqueAlphaCount++;
    expect(opaqueAlphaCount).toBe(80 * 60);
  });

  it("is deterministic — same params produce byte-identical output", () => {
    const a = computeNebulaImageData(baseParams({ seed: 7777 }));
    const b = computeNebulaImageData(baseParams({ seed: 7777 }));
    expect(a).toEqual(b);
  });

  it("different seeds produce different output", () => {
    const a = computeNebulaImageData(baseParams({ seed: 1 }));
    const b = computeNebulaImageData(baseParams({ seed: 2 }));
    expect(a).not.toEqual(b);
  });

  it("different palettes produce different output", () => {
    const cool = computeNebulaImageData(
      baseParams({ colors: ["#000080", "#0044aa", "#0088ff", "#88ddff"] }),
    );
    const warm = computeNebulaImageData(
      baseParams({ colors: ["#330000", "#aa3300", "#ff5500", "#ffaa55"] }),
    );
    expect(cool).not.toEqual(warm);
  });

  it("different density values produce different output", () => {
    const sparse = computeNebulaImageData(baseParams({ density: 0.1 }));
    const dense = computeNebulaImageData(baseParams({ density: 0.9 }));
    expect(sparse).not.toEqual(dense);
  });

  it("density undefined behaves like density 0.5 (legacy compatibility)", () => {
    const omitted = computeNebulaImageData(baseParams({ density: undefined }));
    const half = computeNebulaImageData(baseParams({ density: 0.5 }));
    expect(omitted).toEqual(half);
  });

  it("different lightAngle values produce different output (vignette shifts)", () => {
    const north = computeNebulaImageData(baseParams({ lightAngle: 0 }));
    const south = computeNebulaImageData(baseParams({ lightAngle: 180 }));
    expect(north).not.toEqual(south);
  });

  it("lightAngle undefined matches lightAngle absent (no regression)", () => {
    const omitted = computeNebulaImageData(baseParams({ lightAngle: undefined }));
    const absent = computeNebulaImageData(baseParams());
    expect(omitted).toEqual(absent);
  });

  it("warm-toned palette produces redder average than blue-toned palette (same seed)", () => {
    const cool = computeNebulaImageData(
      baseParams({ colors: ["#000080", "#0044aa", "#0088ff", "#88ddff"] }),
    );
    const warm = computeNebulaImageData(
      baseParams({ colors: ["#330000", "#aa3300", "#ff5500", "#ffaa55"] }),
    );
    const avg = (data: Uint8ClampedArray, channel: 0 | 1 | 2) => {
      let sum = 0;
      const pixels = data.length / 4;
      for (let i = channel; i < data.length; i += 4) sum += data[i];
      return sum / pixels;
    };
    expect(avg(warm, 0)).toBeGreaterThan(avg(cool, 0)); // warm has more red
    expect(avg(warm, 2)).toBeLessThan(avg(cool, 2)); // warm has less blue
  });
});
