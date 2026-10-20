import { describe, expect, it } from "vitest";
import { REVEAL_MS, REVEAL_QUICK_MS, revealDurationMs } from "./reveal";

describe("revealDurationMs", () => {
  it("opens the circle in well under half a second", () => {
    expect(revealDurationMs(null)).toBe(REVEAL_MS);
    expect(REVEAL_MS).toBeLessThanOrEqual(450);
  });

  it("is quicker when shuffles come in a row (Space held or tapped fast)", () => {
    expect(revealDurationMs(300)).toBe(REVEAL_QUICK_MS);
    expect(REVEAL_QUICK_MS).toBeLessThan(REVEAL_MS);
  });

  it("goes back to the full reveal after a pause", () => {
    expect(revealDurationMs(5000)).toBe(REVEAL_MS);
  });
});
