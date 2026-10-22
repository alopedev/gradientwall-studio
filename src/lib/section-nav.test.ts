import { describe, expect, it } from "vitest";
import { alreadyThere, onScreen, scrollKind } from "./section-nav";

describe("scrollKind", () => {
  it("moves the page up when the target is further down", () => {
    expect(scrollKind(1200)).toBe("scroll-down");
  });

  it("moves the page down when the target is above", () => {
    expect(scrollKind(-800)).toBe("scroll-up");
  });

  it("has nothing to slide when the target is already at the top", () => {
    expect(scrollKind(0)).toBeUndefined();
    expect(scrollKind(4)).toBeUndefined();
  });
});

describe("onScreen", () => {
  const box = (top: number, height: number, width = 100) => ({
    top,
    bottom: top + height,
    width,
  });

  it("is true for a box inside the viewport", () => {
    expect(onScreen(box(200, 300), 800)).toBe(true);
  });

  it("is true for a box only partly in view", () => {
    expect(onScreen(box(700, 300), 800)).toBe(true);
  });

  it("is false for a box above or below the viewport", () => {
    expect(onScreen(box(-500, 300), 800)).toBe(false);
    expect(onScreen(box(900, 300), 800)).toBe(false);
  });

  it("is false for a hidden box", () => {
    expect(onScreen(box(200, 0, 0), 800)).toBe(false);
  });
});

describe("alreadyThere", () => {
  it("is true when the section already sits near the top of the screen", () => {
    expect(alreadyThere(0, 800)).toBe(true);
    expect(alreadyThere(-150, 800)).toBe(true);
    expect(alreadyThere(200, 800)).toBe(true);
  });

  it("is false when the section is a screen or more away", () => {
    expect(alreadyThere(900, 800)).toBe(false);
    expect(alreadyThere(-600, 800)).toBe(false);
  });
});
