// @vitest-environment node
import { describe, it, expect } from "vitest";
import { normalizeHex, pushRecent, RECENT_COLORS_CAP } from "./recent-colors";

describe("normalizeHex", () => {
  it("uppercases and prepends '#' regardless of input shape", () => {
    expect(normalizeHex("ff0000")).toBe("#FF0000");
    expect(normalizeHex("#ff0000")).toBe("#FF0000");
    expect(normalizeHex("  #aAbBcC  ")).toBe("#AABBCC");
  });
});

describe("pushRecent", () => {
  it("normalizes case and prefix; new color goes to the front", () => {
    expect(pushRecent([], "ff0000")).toEqual(["#FF0000"]);
    expect(pushRecent(["#0000FF"], "#aabbcc")).toEqual(["#AABBCC", "#0000FF"]);
  });

  it("dedupes by uppercase and re-promotes existing entry to the front", () => {
    const out = pushRecent(["#AABBCC", "#112233"], "#aabbcc");
    expect(out).toEqual(["#AABBCC", "#112233"]);
    expect(out).toHaveLength(2);
  });

  it("caps at RECENT_COLORS_CAP, dropping the oldest entry", () => {
    const full = Array.from(
      { length: RECENT_COLORS_CAP },
      (_, i) => "#" + i.toString(16).padStart(6, "0").toUpperCase(),
    );
    const out = pushRecent(full, "#FFFFFF");
    expect(out[0]).toBe("#FFFFFF");
    expect(out).toHaveLength(RECENT_COLORS_CAP);
    expect(out).not.toContain(full[full.length - 1]);
  });

  it("does not mutate the input array (immutable contract)", () => {
    const input = ["#AABBCC"];
    const snapshot = [...input];
    pushRecent(input, "#112233");
    expect(input).toEqual(snapshot);
  });
});
