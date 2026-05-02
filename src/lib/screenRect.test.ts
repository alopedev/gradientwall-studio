import { describe, it, expect } from "vitest";
import { detectScreenRect, rectCornersAfterCSSRotate, aabbOfCorners } from "./screenRect";

const IMG_W = 1024;
const IMG_H = 1024;

describe("detectScreenRect — CSS-CW sign convention", () => {
  it("returns rotateDeg = 0 for an axis-aligned rect", () => {
    const corners = {
      tl: { x: 100, y: 100 },
      tr: { x: 300, y: 100 },
      bl: { x: 100, y: 500 },
      br: { x: 300, y: 500 },
    };
    const r = detectScreenRect(corners, aabbOfCorners(corners), IMG_W, IMG_H);
    expect(r.rotateDeg).toBeCloseTo(0, 3);
  });

  it("returns rotateDeg > 0 for a CW-tilted rect (BL is to the LEFT of TL)", () => {
    // CW visually = top tilts right, so going down the left edge bends LEFT
    const corners = {
      tl: { x: 200, y: 100 },
      tr: { x: 400, y: 120 },
      bl: { x: 180, y: 500 },
      br: { x: 380, y: 520 },
    };
    const r = detectScreenRect(corners, aabbOfCorners(corners), IMG_W, IMG_H);
    expect(r.rotateDeg).toBeGreaterThan(0);
  });

  it("returns rotateDeg < 0 for a CCW-tilted rect (BL is to the RIGHT of TL)", () => {
    // CCW visually = top tilts left, so going down the left edge bends RIGHT
    const corners = {
      tl: { x: 200, y: 120 },
      tr: { x: 400, y: 100 },
      bl: { x: 220, y: 520 },
      br: { x: 420, y: 500 },
    };
    const r = detectScreenRect(corners, aabbOfCorners(corners), IMG_W, IMG_H);
    expect(r.rotateDeg).toBeLessThan(0);
  });

  it("matches the iPhone PNG measurement: |rotate| ≈ 4.68° AND CCW (negative)", () => {
    // Corner pixels + flood-fill AABB measured against
    // public/assets/deviceMockups/iPhoneMockup.png by
    // /tmp/find_screen_corners.py. The phone in the photo tilts CCW.
    const corners = {
      tl: { x: 373, y: 203 },
      tr: { x: 635, y: 205 },
      bl: { x: 425, y: 820 },
      br: { x: 682, y: 797 },
    };
    const aabb = { minX: 359, minY: 184, maxX: 698, maxY: 830 };
    const r = detectScreenRect(corners, aabb, 1024, 1024);
    // Sign regression — would catch the bug fixed in this commit
    expect(r.rotateDeg).toBeLessThan(0);
    expect(Math.abs(r.rotateDeg)).toBeCloseTo(4.68, 1);
    // Dimensions match the manual Python script output
    expect(r.widthPct).toBeCloseTo(28.23, 1);
    expect(r.heightPct).toBeCloseTo(60.99, 1);
  });

  it("detects a non-zero corner radius for the iPhone PNG (the screen has rounded corners)", () => {
    const corners = {
      tl: { x: 373, y: 203 },
      tr: { x: 635, y: 205 },
      bl: { x: 425, y: 820 },
      br: { x: 682, y: 797 },
    };
    const aabb = { minX: 359, minY: 184, maxX: 698, maxY: 830 };
    const r = detectScreenRect(corners, aabb, 1024, 1024);
    // Phones have noticeably rounded corners (radius ≈ 5–7% of width).
    // The two-axis split is necessary for circular pixel corners on a
    // non-square element.
    expect(r.borderRadiusXPct).toBeGreaterThan(8);
    expect(r.borderRadiusXPct).toBeLessThan(20);
    expect(r.borderRadiusYPct).toBeGreaterThan(3);
    expect(r.borderRadiusYPct).toBeLessThan(10);
    // The pixel radius (X·width = Y·height) should be self-consistent:
    // both axes should agree on the same pixel radius (modulo floating noise).
    const pxR_X = (r.borderRadiusXPct / 100) * (r.widthPct / 100) * 1024;
    const pxR_Y = (r.borderRadiusYPct / 100) * (r.heightPct / 100) * 1024;
    expect(pxR_X).toBeCloseTo(pxR_Y, 1);
  });

  it("round-trip: applying CSS rotate to the produced rect reconstructs the input AABB", () => {
    // Synthetic SHARP-CORNER tilted rect — for sharp rects the AABB of the
    // 4 corners IS the rect's true AABB, so we can use aabbOfCorners().
    // Exercises both the W/H solve and rectCornersAfterCSSRotate. A sign
    // error in either would surface as a mismatched bounding box.
    const corners = {
      tl: { x: 200, y: 130 },
      tr: { x: 480, y: 100 },
      bl: { x: 230, y: 580 },
      br: { x: 510, y: 550 },
    };
    const aabb = aabbOfCorners(corners);
    const r = detectScreenRect(corners, aabb, IMG_W, IMG_H);
    const out = rectCornersAfterCSSRotate(r, IMG_W, IMG_H);

    const inXs = [corners.tl.x, corners.tr.x, corners.bl.x, corners.br.x];
    const inYs = [corners.tl.y, corners.tr.y, corners.bl.y, corners.br.y];
    const outXs = [out.tl.x, out.tr.x, out.bl.x, out.br.x];
    const outYs = [out.tl.y, out.tr.y, out.bl.y, out.br.y];

    expect(Math.min(...outXs)).toBeCloseTo(Math.min(...inXs), 0);
    expect(Math.max(...outXs)).toBeCloseTo(Math.max(...inXs), 0);
    expect(Math.min(...outYs)).toBeCloseTo(Math.min(...inYs), 0);
    expect(Math.max(...outYs)).toBeCloseTo(Math.max(...inYs), 0);
  });
});
