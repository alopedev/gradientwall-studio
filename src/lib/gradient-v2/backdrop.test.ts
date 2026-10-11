// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BACKDROP_MAX_PIXELS,
  BACKDROP_MIN_FRAME_MS,
  backdropSize,
  mixHex,
  shouldRunBackdrop,
  stepPalette,
} from "./backdrop";

describe("backdropSize", () => {
  it("renders at a fraction of the CSS box: the field is soft, the browser upscales it", () => {
    expect(backdropSize(1440, 900)).toEqual({ width: 576, height: 360 });
  });

  it("never goes below a size where the field turns to noise", () => {
    expect(backdropSize(100, 100)).toEqual({ width: 320, height: 240 });
  });

  it("caps the pixel count on huge screens, keeping the aspect ratio", () => {
    const { width, height } = backdropSize(5120, 2880);
    expect(width * height).toBeLessThanOrEqual(BACKDROP_MAX_PIXELS);
    expect(width / height).toBeCloseTo(5120 / 2880, 1);
  });

  it("returns whole pixels", () => {
    const { width, height } = backdropSize(391, 843);
    expect(Number.isInteger(width)).toBe(true);
    expect(Number.isInteger(height)).toBe(true);
  });
});

describe("mixHex", () => {
  it("returns the endpoints at t = 0 and t = 1", () => {
    expect(mixHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mixHex("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("blends channel by channel", () => {
    expect(mixHex("#000000", "#ff8040", 0.5)).toBe("#804020");
  });

  it("clamps t", () => {
    expect(mixHex("#102030", "#ffffff", -3)).toBe("#102030");
    expect(mixHex("#102030", "#ffffff", 9)).toBe("#ffffff");
  });
});

describe("stepPalette", () => {
  const A = ["#000000", "#000000", "#000000", "#000000"] as const;
  const B = ["#ffffff", "#ffffff", "#ffffff", "#ffffff"] as const;

  it("moves toward the target without overshooting", () => {
    const next = stepPalette(A, B, 0.1);
    expect(next[0]).not.toBe("#000000");
    expect(next[0]).not.toBe("#ffffff");
  });

  it("lands exactly on the target after enough time", () => {
    let cur: readonly string[] = A;
    for (let i = 0; i < 120; i++) cur = stepPalette(cur, B, 1 / 30);
    expect(cur).toEqual([...B]);
  });

  it("does not move when time doesn't pass", () => {
    expect(stepPalette(A, B, 0)).toEqual([...A]);
  });
});

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
