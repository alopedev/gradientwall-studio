// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  applyToneToPixels,
  clampTone,
  formatTone,
  TONE_STRENGTH,
  toneExponent,
  toneLut,
} from "./tone";

describe("tone curve", () => {
  it("is exactly the identity at 0 (and when absent)", () => {
    expect(toneExponent(0)).toBe(1);
    expect(toneExponent()).toBe(1);
  });

  it("darkens below 0 and lightens above, stronger the further out", () => {
    expect(toneExponent(-40)).toBeGreaterThan(1);
    expect(toneExponent(-100)).toBeGreaterThan(toneExponent(-40));
    expect(toneExponent(40)).toBeLessThan(1);
    expect(toneExponent(100)).toBeCloseTo(2 ** -TONE_STRENGTH);
    expect(toneExponent(-100)).toBeCloseTo(2 ** TONE_STRENGTH);
  });

  it("clamps and rounds out-of-range input", () => {
    expect(clampTone(250)).toBe(100);
    expect(clampTone(-7.6)).toBe(-8);
    expect(clampTone(Number.NaN)).toBe(0);
    expect(toneExponent(500)).toBe(toneExponent(100));
  });

  it("the CPU table is the identity at 0 and keeps black and white at the ends", () => {
    expect([...toneLut(0)]).toEqual([...Array(256).keys()]);
    expect(toneLut(-50)[128]).toBeLessThan(128);
    expect(toneLut(50)[128]).toBeGreaterThan(128);
    for (const t of [-100, 100]) expect([toneLut(t)[0], toneLut(t)[255]]).toEqual([0, 255]);
    const lut = toneLut(-100);
    for (let v = 1; v < 256; v++) expect(lut[v]).toBeGreaterThanOrEqual(lut[v - 1]!);
  });

  it("matches the GPU curve and leaves alpha alone", () => {
    expect(toneLut(-60)[128]).toBe(Math.round(255 * (128 / 255) ** toneExponent(-60)));
    const px = new Uint8ClampedArray([128, 128, 128, 200]);
    applyToneToPixels(px, -60);
    expect([...px]).toEqual([toneLut(-60)[128], toneLut(-60)[128], toneLut(-60)[128], 200]);
  });

  it("formats with a sign", () => {
    expect(formatTone(0)).toBe("0");
    expect(formatTone(25)).toBe("+25");
    expect(formatTone(-25)).toBe("−25");
  });
});
