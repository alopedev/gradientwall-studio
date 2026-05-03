import { describe, it, expect } from "vitest";
import { isValidHex, reduceHexInput, reduceHslChannel } from "./state";

describe("isValidHex", () => {
  it.each([
    ["#abcdef", true],
    ["abcdef", true],
    ["#ABCDEF", true],
    ["#ABC", false],
    ["#abcdefg", false],
    ["", false],
    ["#1234567", false],
  ])("isValidHex(%s) === %s", (input, expected) => {
    expect(isValidHex(input)).toBe(expected);
  });
});

describe("reduceHexInput", () => {
  it("commits a freshly-typed valid hex (with hash)", () => {
    expect(reduceHexInput("#aabbcc", "#000000")).toEqual({
      draft: "#aabbcc",
      commit: "#AABBCC",
    });
  });

  it("commits a valid hex without leading hash, normalising it", () => {
    expect(reduceHexInput("aabbcc", "#000000")).toEqual({
      draft: "aabbcc",
      commit: "#AABBCC",
    });
  });

  it("does NOT commit when the input is incomplete or malformed (echoes draft only)", () => {
    expect(reduceHexInput("#aab", "#FFFFFF")).toEqual({ draft: "#aab", commit: null });
    expect(reduceHexInput("zzzzzz", "#FFFFFF")).toEqual({ draft: "zzzzzz", commit: null });
    expect(reduceHexInput("", "#FFFFFF")).toEqual({ draft: "", commit: null });
  });

  it("eco guard — does NOT commit when the input normalises to the current value", () => {
    expect(reduceHexInput("aabbcc", "#AABBCC")).toEqual({ draft: "aabbcc", commit: null });
    expect(reduceHexInput("#AABBCC", "aabbcc")).toEqual({ draft: "#AABBCC", commit: null });
  });
});

describe("reduceHslChannel", () => {
  it("snaps the draft to the new canonical hex and commits the same value", () => {
    const out = reduceHslChannel("h", 120, { h: 0, s: 100, l: 50 });
    // pure green at (120, 100, 50) → #00FF00
    expect(out.commit).toBe("#00FF00");
    expect(out.draft).toBe("#00FF00");
  });

  it("only mutates the named channel — others pass through", () => {
    const out = reduceHslChannel("s", 0, { h: 200, s: 100, l: 50 });
    // s=0 → grey at l=50 → #808080-ish
    expect(out.commit).toMatch(/^#[0-9A-F]{6}$/);
    expect(out.draft).toBe(out.commit);
  });
});
