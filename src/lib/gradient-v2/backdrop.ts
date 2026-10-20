/**
 * Pure helpers for the wallpaper drifting inside the Studio's device (the name
 * is a leftover of the page backdrop it replaced). No DOM, no WebGL: sizing,
 * frame pacing and the "should it run at all" rule. The component that uses
 * them is `ScreenMotion`.
 */

/** ~30 fps: the wallpaper drifts slowly, more frames would only burn battery. */
export const BACKDROP_MIN_FRAME_MS = 1000 / 30;

/**
 * The Studio's device screen: the current wallpaper drifts there (identity B,
 * 2026-10-12) instead of behind the page: the screen box at the device pixel
 * ratio (at most 1.5x), with a pixel ceiling.
 */
export const SCREEN_MOTION_MAX_DPR = 1.5;
export const SCREEN_MOTION_MAX_PIXELS = 600_000;

export function screenMotionSize(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
): { width: number; height: number } {
  const k = Math.min(Math.max(dpr, 1), SCREEN_MOTION_MAX_DPR);
  let w = cssWidth * k;
  let h = cssHeight * k;
  const px = w * h;
  if (px > SCREEN_MOTION_MAX_PIXELS) {
    const s = Math.sqrt(SCREEN_MOTION_MAX_PIXELS / px);
    w *= s;
    h *= s;
  }
  return { width: Math.max(1, Math.floor(w)), height: Math.max(1, Math.floor(h)) };
}

export interface BackdropEnv {
  webgl2: boolean;
  /** WebGL emulated on the CPU (`isSoftwareRenderer`): a drifting field would hog the main thread. */
  softwareGl: boolean;
  reducedMotion: boolean;
  saveData: boolean;
}

/** The backdrop moves only on a real GPU and only if the visitor hasn't asked for less. */
export function shouldRunBackdrop({
  webgl2,
  softwareGl,
  reducedMotion,
  saveData,
}: BackdropEnv): boolean {
  return webgl2 && !softwareGl && !reducedMotion && !saveData;
}

/**
 * Whether a WebGL renderer name is a CPU rasteriser (SwiftShader, llvmpipe,
 * Windows' Basic Render Driver): what machines without a GPU, Lighthouse and
 * crawlers' headless Chrome run. An empty name (hidden by the browser) counts
 * as a real GPU.
 */
export function isSoftwareRenderer(name: string): boolean {
  return /swiftshader|llvmpipe|softpipe|basic render driver/i.test(name);
}

/**
 * rAF timestamps are coarsened (Chrome: 0.1 ms), so two 60 Hz frames can read
 * 33.3 ms, just under 1000 / 30. Without some slack every other drawn frame is
 * skipped and the field stutters between 30 and 20 fps.
 */
const FRAME_SLACK_MS = 4;

/** Whether enough time has passed since the last drawn frame to draw another. */
export function frameDue(elapsedMs: number, minFrameMs = BACKDROP_MIN_FRAME_MS): boolean {
  return elapsedMs >= minFrameMs - FRAME_SLACK_MS;
}
