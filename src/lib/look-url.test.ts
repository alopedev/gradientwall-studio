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

  it("adds the material as a sixth part, and leaves it out when there is none", () => {
    expect(encodeLookParam({ ...look, material: "fluted" })).toBe(
      "liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45-fluted",
    );
    expect(encodeLookParam({ ...look, material: "none" })).toBe(encodeLookParam(look));
    expect(decodeLookParam(encodeLookParam({ ...look, material: "halftone" }))).toEqual({
      ...look,
      material: "halftone",
    });
  });

  it("adds a turn as r<degrees>, after the material, and reads both back", () => {
    const turned = { ...look, material: "dither" as const, rotation: 90 };
    expect(encodeLookParam(turned)).toBe(
      "liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45-dither-r90",
    );
    expect(decodeLookParam(encodeLookParam(turned))).toEqual(turned);
    expect(decodeLookParam("liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45-r30")?.rotation).toBe(
      30,
    );
    expect(encodeLookParam({ ...look, rotation: 0 })).toBe(encodeLookParam(look));
  });

  it("adds a tone as l<n> (lighter) or d<n> (darker), and reads it back", () => {
    const dark = { ...look, material: "dither" as const, rotation: 90, tone: -30 };
    expect(encodeLookParam(dark)).toBe(
      "liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45-dither-r90-d30",
    );
    expect(decodeLookParam(encodeLookParam(dark))).toEqual(dark);
    expect(decodeLookParam("liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45-l45")?.tone).toBe(45);
    expect(encodeLookParam({ ...look, tone: 0 })).toBe(encodeLookParam(look));
    expect(decodeLookParam("liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45-d101")).toBeNull();
    expect(decodeLookParam("liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45-l5-d5")).toBeNull();
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
    ["liquid-1-2b1055.7597de.ff6e7f.ffd86e-315-45-velvet", "unknown material"],
    ["liquid-1-2b1055.7597de.ff6e7f.ffd86e-315-45-r400", "turn out of range"],
    ["liquid-1-2b1055.7597de.ff6e7f.ffd86e-315-45-r9-r9", "two turns"],
  ])("rejects %s (%s)", (value) => {
    expect(decodeLookParam(value)).toBeNull();
  });
});
