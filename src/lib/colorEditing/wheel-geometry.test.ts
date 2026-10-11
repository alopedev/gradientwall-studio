import { describe, expect, it } from "vitest";
import { computeHarmonicColors, slotHues } from "../gradient/harmonic-edit";
import {
  bulletPosition,
  LIGHT_PERIMETER_RADIUS,
  lightAngleFromPointer,
  lightHandlePosition,
  offsetFromRectCenter,
  RADIUS_MAX,
  type Slot,
  slotHueFromState,
  wheelStateFromPointer,
} from "./wheel-geometry";

const SLOTS: Slot[] = [0, 1, 2, 3];

describe("bulletPosition", () => {
  it("puts zero lightness at the centre and full lightness on the edge", () => {
    const centre = bulletPosition(123, 0);
    expect(centre.x).toBeCloseTo(0);
    expect(centre.y).toBeCloseTo(0);
    const edge = bulletPosition(0, 90);
    expect(edge.x).toBeCloseTo(RADIUS_MAX);
    expect(edge.y).toBeCloseTo(0);
  });

  it("measures hue clockwise from the right (screen y grows down)", () => {
    const p = bulletPosition(90, 90);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(RADIUS_MAX);
  });

  it("clamps lightness outside 0..90", () => {
    expect(bulletPosition(0, 500).x).toBeCloseTo(RADIUS_MAX);
    expect(bulletPosition(0, -5).x).toBeCloseTo(0);
  });
});

describe("wheelStateFromPointer", () => {
  it("places the focal slot under the pointer, whichever slot is dragged", () => {
    for (const slot of SLOTS) {
      const state = wheelStateFromPointer(30, -40, slot);
      expect(state.focalSlot).toBe(slot);
      const hue = slotHueFromState(state, slot);
      // Pointer at (30, -40): hue = atan2(-40, 30) wrapped to 0..360.
      const expected = (Math.atan2(-40, 30) * 180) / Math.PI + 360;
      expect(hue).toBeCloseTo(expected % 360, 6);
    }
  });

  it("clamps the radius to the wheel edge", () => {
    const far = wheelStateFromPointer(10_000, 0, 0);
    const edge = wheelStateFromPointer(RADIUS_MAX, 0, 0);
    expect(far.anchorLight).toBeCloseTo(edge.anchorLight);
    expect(far.spread).toBeCloseTo(edge.spread);
  });

  it("narrows the spread towards the edge and widens it at the centre", () => {
    expect(wheelStateFromPointer(0, 0, 0).spread).toBeGreaterThan(
      wheelStateFromPointer(RADIUS_MAX, 0, 0).spread,
    );
  });

  it("yields a state whose colours are four valid hex values", () => {
    const colors = computeHarmonicColors(wheelStateFromPointer(-20, 25, 2));
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("slotHueFromState", () => {
  it("agrees with slotHues for every slot", () => {
    const state = wheelStateFromPointer(40, 10, 1);
    const all = slotHues(state);
    for (const slot of SLOTS) expect(slotHueFromState(state, slot)).toBe(all[slot]);
  });
});

describe("light handle", () => {
  it("sits on the ring at the compass angle", () => {
    const top = lightHandlePosition(0);
    expect(top.x).toBeCloseTo(0);
    expect(top.y).toBeCloseTo(-LIGHT_PERIMETER_RADIUS);
    const right = lightHandlePosition(90);
    expect(right.x).toBeCloseTo(LIGHT_PERIMETER_RADIUS);
    expect(right.y).toBeCloseTo(0);
  });

  it("maps pointer offsets back to compass degrees", () => {
    expect(lightAngleFromPointer(0, -10)).toBe(0);
    expect(lightAngleFromPointer(10, 0)).toBe(90);
    expect(lightAngleFromPointer(0, 10)).toBe(180);
    expect(lightAngleFromPointer(-10, 0)).toBe(270);
  });

  it("round-trips position → angle", () => {
    for (const deg of [0, 37, 90, 181, 270, 359]) {
      const { x, y } = lightHandlePosition(deg);
      expect(lightAngleFromPointer(x, y)).toBe(deg);
    }
  });
});

describe("offsetFromRectCenter", () => {
  it("is relative to the rect centre", () => {
    const rect = { left: 100, top: 50, width: 40, height: 20 };
    expect(offsetFromRectCenter(rect, 120, 60)).toEqual({ x: 0, y: 0 });
    expect(offsetFromRectCenter(rect, 130, 55)).toEqual({ x: 10, y: -5 });
  });
});
