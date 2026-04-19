import { describe, it, expect } from "vitest";
import { kmeans } from "./color-extract";

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
    for (let i = 0; i < 30; i++) points.push([50 + (i % 3) * 2, 50 + (i % 3) * 2, 50 + (i % 3) * 2]);
    for (let i = 0; i < 30; i++) points.push([200 + (i % 3) * 2, 80 + (i % 3) * 2, 50 + (i % 3) * 2]);
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
