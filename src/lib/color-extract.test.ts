import { describe, it, expect } from "vitest";
import { extractFromPixels, kmeans } from "./color-extract";

type RGB = [number, number, number];

describe("kmeans", () => {
  it("returns exactly k centroids", () => {
    const points: RGB[] = [
      [0, 0, 0],
      [10, 10, 10],
      [250, 250, 250],
      [240, 240, 240],
    ];
    const out = kmeans(points, 2, 10);
    expect(out).toHaveLength(2);
  });

  it("clusters clearly separated groups around their means", () => {
    // Two tight clusters: near black and near white
    const points: RGB[] = [];
    for (let i = 0; i < 50; i++) points.push([5 + i * 0.1, 5 + i * 0.1, 5 + i * 0.1]);
    for (let i = 0; i < 50; i++) points.push([245 + i * 0.1, 245 + i * 0.1, 245 + i * 0.1]);
    const out = kmeans(points, 2, 20);
    const sorted = out.map((c) => c[0]).sort((a, b) => a - b);
    expect(sorted[0]).toBeLessThan(50); // dark cluster mean is low
    expect(sorted[1]).toBeGreaterThan(200); // light cluster mean is high
  });

  it("handles more centroids requested than points by returning near-duplicates rather than crashing", () => {
    const points: RGB[] = [[100, 100, 100]];
    const out = kmeans(points, 4, 10);
    expect(out).toHaveLength(4);
    // All centroids land near the single point
    out.forEach((c) => {
      expect(Math.abs(c[0] - 100)).toBeLessThan(1);
    });
  });

  it("is stable under many iterations (converged clusters don't drift)", () => {
    const points: RGB[] = [];
    for (let i = 0; i < 30; i++)
      points.push([50 + (i % 3) * 2, 50 + (i % 3) * 2, 50 + (i % 3) * 2]);
    for (let i = 0; i < 30; i++)
      points.push([200 + (i % 3) * 2, 80 + (i % 3) * 2, 50 + (i % 3) * 2]);
    const a = kmeans(points.slice(), 2, 50);
    const b = kmeans(points.slice(), 2, 100);
    // Sort by first component for deterministic comparison
    a.sort((x, y) => x[0] - y[0]);
    b.sort((x, y) => x[0] - y[0]);
    for (let ci = 0; ci < 2; ci++) {
      for (let d = 0; d < 3; d++) {
        expect(Math.abs(a[ci][d] - b[ci][d])).toBeLessThan(1);
      }
    }
  });
});

/**
 * Helper: build a Uint8ClampedArray of `n` RGBA pixels, all with the given RGB + alpha.
 */
function buffer(pixels: Array<[number, number, number, number]>): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i++) {
    out[i * 4] = pixels[i][0];
    out[i * 4 + 1] = pixels[i][1];
    out[i * 4 + 2] = pixels[i][2];
    out[i * 4 + 3] = pixels[i][3];
  }
  return out;
}

describe("extractFromPixels", () => {
  it("returns exactly 4 hex strings for an image with 4 dominant colors", () => {
    // 40 pixels: 10 near each of black/red/green/blue
    const pixels: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 10; i++) pixels.push([5 + i * 0.1, 5 + i * 0.1, 5 + i * 0.1, 255]);
    for (let i = 0; i < 10; i++) pixels.push([230 + i * 0.1, 10 + i * 0.1, 15 + i * 0.1, 255]);
    for (let i = 0; i < 10; i++) pixels.push([20 + i * 0.1, 200 + i * 0.1, 30 + i * 0.1, 255]);
    for (let i = 0; i < 10; i++) pixels.push([15 + i * 0.1, 25 + i * 0.1, 220 + i * 0.1, 255]);
    const out = extractFromPixels(buffer(pixels));
    expect(out).toHaveLength(4);
    out.forEach((hex) => expect(hex).toMatch(/^#[0-9a-f]{6}$/));
  });

  it("sorts output colors by BT.709 luminance ascending (darkest first)", () => {
    const pixels: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 8; i++) pixels.push([0, 0, 0, 255]); // black (lum 0)
    for (let i = 0; i < 8; i++) pixels.push([100, 100, 100, 255]); // mid-gray
    for (let i = 0; i < 8; i++) pixels.push([180, 180, 180, 255]); // lighter gray
    for (let i = 0; i < 8; i++) pixels.push([255, 255, 255, 255]); // white
    const out = extractFromPixels(buffer(pixels));
    const lums = out.map((hex) => {
      const n = parseInt(hex.slice(1), 16);
      const r = (n >> 16) & 0xff;
      const g = (n >> 8) & 0xff;
      const b = n & 0xff;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    });
    for (let i = 0; i < lums.length - 1; i++) {
      expect(lums[i]).toBeLessThanOrEqual(lums[i + 1]);
    }
  });

  it("drops pixels with alpha < 128 (transparent pixels ignored)", () => {
    // 4 opaque whites + 100 transparent blacks. All-white output is the only cluster.
    const pixels: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 4; i++) pixels.push([255, 255, 255, 255]);
    for (let i = 0; i < 100; i++) pixels.push([0, 0, 0, 50]); // alpha 50 < 128
    const out = extractFromPixels(buffer(pixels));
    // Should have 4 near-white centroids — transparents ignored
    out.forEach((hex) => expect(hex).toMatch(/^#f[ef][ef][ef][ef][ef]$/i));
  });

  it("keeps pixels with alpha exactly 128 (boundary inclusive at ≥128)", () => {
    const pixels: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 4; i++) pixels.push([255, 0, 0, 128]); // exactly at threshold
    const out = extractFromPixels(buffer(pixels));
    expect(out).toHaveLength(4);
    out.forEach((hex) => expect(hex).toMatch(/^#f[0-9a-f]0000$/i));
  });

  it("throws a clear error when all pixels are transparent", () => {
    const pixels: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 10; i++) pixels.push([128, 128, 128, 0]);
    expect(() => extractFromPixels(buffer(pixels))).toThrow(/no opaque pixels/i);
  });

  it("throws on empty pixel buffer", () => {
    expect(() => extractFromPixels(new Uint8ClampedArray(0))).toThrow(/no opaque pixels/i);
  });

  it("handles a monochrome image (all same color) without crashing, 4 centroids collapse", () => {
    const pixels: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 100; i++) pixels.push([120, 80, 200, 255]);
    const out = extractFromPixels(buffer(pixels));
    expect(out).toHaveLength(4);
    // All centroids land on the same color (duplicated via k-means++ degeneracy handling)
    out.forEach((hex) => expect(hex).toBe("#7850c8"));
  });
});
