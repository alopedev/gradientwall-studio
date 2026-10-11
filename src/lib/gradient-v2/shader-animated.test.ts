// @vitest-environment node
import { describe, expect, it } from "vitest";
import { FRAG } from "./shader";
import { FRAG_ANIMATED } from "./shader-animated";

describe("FRAG_ANIMATED", () => {
  it("adds a uTime uniform the signed-off shader doesn't have", () => {
    expect(FRAG).not.toMatch(/\buTime\b/);
    expect(FRAG_ANIMATED).toMatch(/uniform float uTime;/);
  });

  it("drifts the noise offsets with time and nothing else", () => {
    expect(FRAG_ANIMATED).toMatch(/vec2 seedOff\(uint salt\)\{[^}]*uTime/);
    // Same program otherwise: strip the two edits and the rest is byte-for-byte FRAG.
    const stripped = FRAG_ANIMATED.replace(/uniform float uTime;[^\n]*\n/, "").replace(
      /vec2 seedOff\(uint salt\)\{[^\n]*\}/,
      "",
    );
    const base = FRAG.replace(/vec2 seedOff\(uint salt\)\{[^\n]*\}/, "");
    expect(stripped).toBe(base);
  });

  it("is a no-op at t = 0, so the first frame is the approved look", () => {
    // Every drift term is written as f(t + φ) − f(φ); at t = 0 it cancels exactly.
    expect(FRAG_ANIMATED).toMatch(/cos\(uTime\*[\d.]+ \+ [^)]+\) - cos\([^)]+\)/);
    expect(FRAG_ANIMATED).toMatch(/sin\(uTime\*[\d.]+ \+ [^)]+\) - sin\([^)]+\)/);
  });
});
