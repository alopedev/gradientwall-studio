import { describe, expect, it } from "vitest";
import {
  HORIZON_CELLS,
  HORIZON_PIECES,
  ditherIndex,
  horizonCellSize,
  horizonCells,
  horizonGrid,
} from "./pixel-horizon";

describe("pixel horizon", () => {
  it("keeps the same number of cells across the short side at every size", () => {
    expect(horizonCellSize(1320, 2868)).toBe(18);
    expect(horizonCellSize(3840, 2160)).toBe(30);
    expect(horizonCellSize(5120, 2880)).toBe(40);
    expect(horizonGrid(1320, 2868).cols).toBeGreaterThanOrEqual(HORIZON_CELLS - 1);
  });

  it("dithers brightness onto the five ramp colours", () => {
    expect(ditherIndex(0, 3, 5)).toBe(0);
    expect(ditherIndex(1, 3, 5)).toBe(4);
    expect(ditherIndex(Number.NaN, 0, 0)).toBe(0);
  });

  it("has twelve pieces with unique names and black first", () => {
    expect(HORIZON_PIECES).toHaveLength(12);
    expect(new Set(HORIZON_PIECES.map((p) => p.name)).size).toBe(12);
    for (const p of HORIZON_PIECES) expect(p.ramp[0]).toBe("#000000");
  });

  it("is deterministic and only uses ramp indices", () => {
    for (const p of HORIZON_PIECES) {
      const a = horizonCells(p, 72, 157);
      expect(a).toEqual(horizonCells(p, 72, 157));
      expect(Math.max(...a)).toBeLessThanOrEqual(4);
    }
  });

  it("puts the sun brighter than the sky above it", () => {
    const p = HORIZON_PIECES[0];
    const cols = 72;
    const rows = 157;
    const cells = horizonCells(p, cols, rows);
    const at = (u: number, v: number) => cells[Math.floor(v * rows) * cols + Math.floor(u * cols)];
    expect(at(p.sun.x, p.sun.y - 0.03)).toBeGreaterThanOrEqual(3);
    expect(at(0.5, 0.02)).toBeLessThanOrEqual(1);
  });
});
