import { describe, expect, it } from "vitest";
import { decodeLookParam, encodeLookParam, type SharedLook } from "./look-url";

const look: SharedLook = {
  style: "liquid",
  seed: 1234,
  colors: ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"],
  lightAngle: 315,
  grain: 45,
};

describe("look URL", () => {
  it("writes a short, readable value", () => {
    expect(encodeLookParam(look)).toBe("liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45");
  });

  it("reads back what it writes", () => {
    expect(decodeLookParam(encodeLookParam(look))).toEqual(look);
  });

  it("lowercases colours and accepts upper case", () => {
    expect(decodeLookParam("mesh-7-2B1055.7597DE.FF6E7F.FFD86E-90-0")?.colors[0]).toBe("#2b1055");
  });

  it.each([
    ["", "empty"],
    ["plasma-1-2b1055.7597de.ff6e7f.ffd86e-315-45", "unknown style"],
    ["liquid-x-2b1055.7597de.ff6e7f.ffd86e-315-45", "seed not a number"],
    ["liquid-1-2b1055.7597de.ff6e7f-315-45", "three colours"],
    ["liquid-1-2b1055.7597de.ff6e7f.zzzzzz-315-45", "bad hex"],
    ["liquid-1-2b1055.7597de.ff6e7f.ffd86e-400-45", "angle out of range"],
    ["liquid-1-2b1055.7597de.ff6e7f.ffd86e-315-101", "grain out of range"],
    ["liquid-1-2b1055.7597de.ff6e7f.ffd86e-315", "missing field"],
  ])("rejects %s (%s)", (value) => {
    expect(decodeLookParam(value)).toBeNull();
  });
});
