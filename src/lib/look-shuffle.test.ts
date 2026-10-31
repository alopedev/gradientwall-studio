import { describe, expect, it } from "vitest";
import { mulberry32 } from "./gradient/spec";
import { nextLookOption } from "./look-shuffle";

const LOOKS = [
  { id: "glass", label: "Glass", style: "mesh", material: "fluted" },
  { id: "dots", label: "Dots", style: "liquid", material: "halftone" },
  { id: "pixel", label: "Pixel", style: "mesh", material: "dither" },
  { id: "mesh", label: "Mesh", style: "mesh", material: "none" },
  { id: "aurora", label: "Aurora", style: "aurora", material: "none" },
  { id: "liquid", label: "Liquid", style: "liquid", material: "none" },
] as const;

describe("nextLookOption", () => {
  it("never repeats the look on screen, and reaches every other one", () => {
    const rng = mulberry32(7);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const next = nextLookOption(LOOKS, { style: "mesh", material: "dither" }, rng);
      expect(next?.id).not.toBe("pixel");
      if (next) seen.add(next.id);
    }
    expect([...seen].sort()).toEqual(["aurora", "dots", "glass", "liquid", "mesh"]);
  });

  it("reads an absent material as none", () => {
    for (let i = 0; i < 50; i++) {
      expect(nextLookOption(LOOKS, { style: "aurora" })?.id).not.toBe("aurora");
    }
  });

  it("returns null when there is nothing else to pick", () => {
    expect(nextLookOption([], { style: "mesh" })).toBeNull();
    expect(nextLookOption([LOOKS[3]], { style: "mesh", material: "none" })).toBeNull();
  });
});
