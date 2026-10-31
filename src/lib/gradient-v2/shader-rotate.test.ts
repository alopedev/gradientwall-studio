// @vitest-environment node
import { describe, expect, it } from "vitest";
import { FRAG } from "./shader";
import { FRAG_ANIMATED } from "./shader-animated";
import { FRAG_ANIMATED_ROTATABLE, FRAG_STILL_ROTATABLE, rotatable } from "./shader-rotate";

describe("rotatable shader", () => {
  it("adds a uRotate uniform the signed-off shader doesn't have", () => {
    expect(FRAG).not.toMatch(/\buRotate\b/);
    expect(FRAG_STILL_ROTATABLE).toMatch(/uniform float uRotate;/);
    expect(FRAG_ANIMATED_ROTATABLE).toMatch(/uniform float uRotate;/);
  });

  it("only adds the turn to the field angle: strip the two edits and it is FRAG", () => {
    const strip = (s: string) =>
      s.replace(/uniform float uRotate;[^\n]*\n/, "").replace(" + uRotate;", ";");
    expect(strip(FRAG_STILL_ROTATABLE)).toBe(FRAG);
    expect(strip(FRAG_ANIMATED_ROTATABLE)).toBe(FRAG_ANIMATED);
  });

  it("fails loudly if shader.ts no longer has the anchors", () => {
    expect(() => rotatable("void main(){}")).toThrow(/shader-rotate/);
  });
});
