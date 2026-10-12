// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  SCREEN_MOTION_MAX_PIXELS,
  screenMotionSize,
  BACKDROP_MAX_PIXELS,
  BACKDROP_MIN_FRAME_MS,
  backdropSize,
  frameDue,
  mixHex,
  type PixelRect,
  visibleRegions,
  shouldRunBackdrop,
  stepPalette,
} from "./backdrop";

describe("backdropSize", () => {
  it("renders at a fraction of the CSS box: the field is soft, the browser upscales it", () => {
    expect(backdropSize(1440, 900)).toEqual({ width: 432, height: 270 });
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

const area = (rs: PixelRect[]) => rs.reduce((a, r) => a + r.width * r.height, 0);

/** Every buffer pixel, marked by how many regions cover it. */
function coverage(rs: PixelRect[], w: number, h: number): number[] {
  const px = new Array(w * h).fill(0);
  for (const r of rs) {
    for (let y = r.y; y < r.y + r.height; y++) {
      for (let x = r.x; x < r.x + r.width; x++) px[y * w + x]++;
    }
  }
  return px;
}

describe("visibleRegions", () => {
  const canvas = { x: 0, y: 0, width: 1440, height: 900 };
  const buffer = { width: 576, height: 360 };

  it("is the whole buffer when nothing covers the canvas", () => {
    expect(visibleRegions(canvas, null, buffer)).toEqual([{ x: 0, y: 0, width: 576, height: 360 }]);
    const outside = { x: 2000, y: 0, width: 100, height: 100 };
    expect(visibleRegions(canvas, outside, buffer)).toEqual([
      { x: 0, y: 0, width: 576, height: 360 },
    ]);
  });

  it("skips the pixels under an opaque box: the Studio frame hides about half the first screen", () => {
    const studio = { x: 496, y: 98, width: 886, height: 690 };
    const rs = visibleRegions(canvas, studio, buffer, 20);
    const skipped = 1 - area(rs) / (buffer.width * buffer.height);
    expect(skipped).toBeGreaterThan(0.4);
    // No pixel is drawn twice, so the cost is exactly the visible area.
    expect(coverage(rs, buffer.width, buffer.height).every((n) => n <= 1)).toBe(true);
  });

  it("never skips a pixel the box doesn't fully cover (rounded corners, border, edges)", () => {
    const studio = { x: 496.3, y: 98.5, width: 886.1, height: 690 };
    const rs = visibleRegions(canvas, studio, buffer, 20);
    const px = coverage(rs, buffer.width, buffer.height);
    const sx = canvas.width / buffer.width;
    const sy = canvas.height / buffer.height;
    for (let row = 0; row < buffer.height; row++) {
      for (let col = 0; col < buffer.width; col++) {
        if (px[row * buffer.width + col] > 0) continue;
        // GL rows count from the bottom; CSS from the top.
        const cssTop = (buffer.height - row - 1) * sy;
        const cssLeft = col * sx;
        expect(cssLeft).toBeGreaterThanOrEqual(studio.x + 20);
        expect(cssLeft + sx).toBeLessThanOrEqual(studio.x + studio.width - 20);
        expect(cssTop).toBeGreaterThanOrEqual(studio.y + 20);
        expect(cssTop + sy).toBeLessThanOrEqual(studio.y + studio.height - 20);
      }
    }
  });

  it("uses GL coordinates: a box at the top of the page skips rows at the top of the buffer", () => {
    const top = { x: 0, y: 0, width: 1440, height: 450 };
    const rs = visibleRegions(canvas, top, buffer, 0);
    expect(rs).toEqual([{ x: 0, y: 0, width: 576, height: 180 }]);
  });

  it("follows the canvas when the page scrolls (both rects in viewport space)", () => {
    const scrolled = { ...canvas, y: -300 };
    const studio = { x: 496, y: 98 - 300, width: 886, height: 690 };
    expect(visibleRegions(scrolled, studio, buffer, 20)).toEqual(
      visibleRegions(canvas, { ...studio, y: 98 }, buffer, 20),
    );
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
