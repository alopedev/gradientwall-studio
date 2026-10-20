import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion, saveDataOn } from "./motion";

describe("prefersReducedMotion", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reads the visitor's reduced-motion setting", () => {
    const mm = vi.spyOn(window, "matchMedia");
    mm.mockReturnValue({ matches: true } as MediaQueryList);
    expect(prefersReducedMotion()).toBe(true);
    expect(mm).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    mm.mockReturnValue({ matches: false } as MediaQueryList);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("answers false where the browser has no matchMedia", () => {
    const original = window.matchMedia;
    // @ts-expect-error: some embedded browsers lack it
    window.matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
    window.matchMedia = original;
  });
});

describe("saveDataOn", () => {
  it("is true only when the browser reports data saver", () => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    Object.defineProperty(nav, "connection", { value: { saveData: true }, configurable: true });
    expect(saveDataOn()).toBe(true);
    Object.defineProperty(nav, "connection", { value: undefined, configurable: true });
    expect(saveDataOn()).toBe(false);
  });
});
