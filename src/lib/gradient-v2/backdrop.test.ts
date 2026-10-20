// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BACKDROP_MIN_FRAME_MS,
  SCREEN_MOTION_MAX_PIXELS,
  frameDue,
  screenMotionSize,
  shouldRunBackdrop,
} from "./backdrop";

describe("shouldRunBackdrop", () => {
  const ok = { webgl2: true, reducedMotion: false, saveData: false };
  it("runs when the GPU path works and the visitor hasn't asked for less", () => {
    expect(shouldRunBackdrop(ok)).toBe(true);
  });
  it.each([
    ["no WebGL2", { ...ok, webgl2: false }],
    ["reduced motion", { ...ok, reducedMotion: true }],
    ["data saver", { ...ok, saveData: true }],
  ])("stays on the static ambient with %s", (_n, input) => {
    expect(shouldRunBackdrop(input)).toBe(false);
  });
});

describe("BACKDROP_MIN_FRAME_MS", () => {
  it("caps the loop near 30 fps", () => {
    expect(1000 / BACKDROP_MIN_FRAME_MS).toBeLessThanOrEqual(31);
    expect(1000 / BACKDROP_MIN_FRAME_MS).toBeGreaterThanOrEqual(24);
  });
});

describe("frameDue", () => {
  it("draws every other frame on a 60 Hz screen, even with coarsened rAF timestamps", () => {
    // Chrome rounds rAF timestamps to 0.1 ms: two 60 Hz frames read 33.3 ms, under 1000 / 30.
    expect(frameDue(33.3, BACKDROP_MIN_FRAME_MS)).toBe(true);
    expect(frameDue(16.7, BACKDROP_MIN_FRAME_MS)).toBe(false);
  });

  it("keeps about 30 fps on 120 and 144 Hz screens", () => {
    expect(frameDue(25, BACKDROP_MIN_FRAME_MS)).toBe(false);
    expect(frameDue(33.3, BACKDROP_MIN_FRAME_MS)).toBe(true);
    expect(frameDue(27.8, BACKDROP_MIN_FRAME_MS)).toBe(false);
    expect(frameDue(34.7, BACKDROP_MIN_FRAME_MS)).toBe(true);
  });
});

describe("screenMotionSize (the wallpaper moving inside the Studio's device)", () => {
  it("renders the screen box at the device pixel ratio, up to 1.5x", () => {
    expect(screenMotionSize(300, 600, 1)).toEqual({ width: 300, height: 600 });
    expect(screenMotionSize(300, 600, 1.25)).toEqual({ width: 375, height: 750 });
    expect(screenMotionSize(200, 400, 3)).toEqual({ width: 300, height: 600 });
  });

  it("caps the pixels per frame and keeps the screen's shape", () => {
    const { width, height } = screenMotionSize(1200, 675, 2);
    expect(width * height).toBeLessThanOrEqual(SCREEN_MOTION_MAX_PIXELS);
    expect(width / height).toBeCloseTo(1200 / 675, 2);
  });

  it("never asks for an empty buffer", () => {
    expect(screenMotionSize(0, 0, 2)).toEqual({ width: 1, height: 1 });
  });
});
