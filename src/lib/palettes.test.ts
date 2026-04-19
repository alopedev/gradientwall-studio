import { describe, it, expect } from "vitest";
import { activeColors, ALL_ACTIVE, MIN_ACTIVE_COLORS, type ActiveMask, type Colors4 } from "./palettes";

const COLORS: Colors4 = ["#111111", "#222222", "#333333", "#444444"];

describe("activeColors", () => {
  it("returns all four when no mask is provided (back-compat with legacy callers)", () => {
    expect(activeColors(COLORS)).toEqual(["#111111", "#222222", "#333333", "#444444"]);
  });

  it("returns all four when every slot is active", () => {
    expect(activeColors(COLORS, [true, true, true, true])).toEqual(COLORS);
  });

  it("filters out deactivated slots preserving order", () => {
    const mask: ActiveMask = [true, false, true, true];
    expect(activeColors(COLORS, mask)).toEqual(["#111111", "#333333", "#444444"]);
  });

  it("can return the minimum two colors", () => {
    const mask: ActiveMask = [false, true, false, true];
    expect(activeColors(COLORS, mask)).toEqual(["#222222", "#444444"]);
  });
});

describe("ALL_ACTIVE", () => {
  it("is the 4-true tuple", () => {
    expect(ALL_ACTIVE).toEqual([true, true, true, true]);
  });
});

describe("MIN_ACTIVE_COLORS", () => {
  it("is 2 — the smallest color count that still yields a coherent gradient", () => {
    expect(MIN_ACTIVE_COLORS).toBe(2);
  });
});
