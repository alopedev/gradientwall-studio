/**
 * Pure parameter layer for the v2 engine: maps the Studio's `RenderParams`
 * vocabulary (compass light angle, 0..100 grain, 2..4 colour ramp, v1 style
 * names) onto the shader's uniforms. No DOM, no WebGL — fully testable.
 */

import { parseHex, wrapAngle } from "../color";
import { V2_DEFAULT_GRAIN, V2_DEFAULT_LIGHT_ANGLE } from "../defaults";
import type { ColorRamp, Material, Style } from "../palettes";
import { toneExponent } from "../tone";

export const V2_STYLES = ["liquid", "aurora", "grain-mesh"] as const;
export type V2Style = (typeof V2_STYLES)[number];

/** Shader-side `uStyle` index for each v2 style. Must match FRAG's branches. */
export const V2_STYLE_INDEX: Record<V2Style, number> = { liquid: 0, aurora: 1, "grain-mesh": 2 };

interface StyleDefaults {
  warp: number;
  scale: number;
  /** Grain 0..1 used when the caller doesn't pass one. */
  grain: number;
  light: number;
}

/** Per-style look, calibrated in the prototype. */
export const V2_STYLE_DEFAULTS: Record<V2Style, StyleDefaults> = {
  liquid: { warp: 2.0, scale: 0.45, grain: 0.45, light: 0.55 },
  aurora: { warp: 2.5, scale: 1.0, grain: 0.45, light: 0.2 },
  "grain-mesh": { warp: 1.5, scale: 1.0, grain: 0.75, light: 0.3 },
};

/**
 * v1 style names → v2 style. `mesh` maps to the closest v2 look (soft colour
 * fields); `nebula` has no v2 twin, so it falls back to `liquid`.
 */
export function toV2Style(style: Style | V2Style): V2Style {
  switch (style) {
    case "aurora":
      return "aurora";
    case "mesh":
    case "grain-mesh":
      return "grain-mesh";
    default:
      return "liquid";
  }
}

export interface V2Params {
  /** Post-mask colour ramp, 2..4 entries, darkest → lightest ideally. */
  colors: ColorRamp;
  style: Style | V2Style;
  seed: number;
  /** Compass degrees: 0 = top, 90 = right. Undefined = top-left (315), as in the prototype. */
  lightAngle?: number;
  /** Studio grain slider 0..100. Undefined = the style's calibrated default. */
  grain?: number;
  /** TPDF dither before 8-bit quantisation. On unless explicitly disabled. */
  dither?: boolean;
  /** Second pass over the wallpaper (`material.ts`). Undefined = "none". */
  material?: Material;
  /** Clockwise turn of the colour field and its light, degrees. Undefined = 0. */
  rotation?: number;
  /** Lighter / darker over the finished wallpaper, −100..100 (`lib/tone.ts`). Undefined = 0. */
  tone?: number;
}

export interface V2Uniforms {
  seed: number;
  /** 4 colours × RGB in sRGB 0..1 — the shader's `uCol[4]`. */
  colors: number[];
  warp: number;
  scale: number;
  grain: number;
  light: number;
  /** Math angle in radians (x right, y up), as the shader's `uLightAngle` expects. */
  lightAngleRad: number;
  style: number;
  dither: number;
  /** Which material pass runs after the wallpaper, or "none". */
  material: Material;
  /** `uRotate`: radians the field turns (counter-clockwise in sample space = clockwise on screen). */
  rotateRad: number;
  /** `uTone`: gamma exponent of the tone curve; exactly 1 = no tone pass needed. */
  toneExp: number;
}

// The v2 starting look is defined in `lib/defaults.ts`; re-exported for callers of this module.
export { V2_DEFAULT_GRAIN, V2_DEFAULT_LIGHT_ANGLE };
const DEFAULT_COMPASS = V2_DEFAULT_LIGHT_ANGLE;

export function hexToRgb01(hex: string): [number, number, number] {
  const rgb = parseHex(hex);
  if (!rgb) throw new Error(`Invalid hex colour: ${hex}`);
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

/**
 * The shader always mixes 4 stops. A 2- or 3-colour ramp (active mask) is
 * stretched by nearest-stop resampling so dark → light order is kept.
 */
export function rampToFour(colors: ColorRamp): [string, string, string, string] {
  if (colors.length === 0) throw new Error("Colour ramp is empty");
  const n = colors.length;
  const pick = (i: number) => colors[Math.round((i * (n - 1)) / 3)];
  return [pick(0), pick(1), pick(2), pick(3)];
}

/** Compass degrees (0 = top, clockwise) → math radians (0 = right, counter-clockwise, y up). */
export function compassToRadians(deg: number): number {
  const math = wrapAngle(90 - deg);
  return (math * Math.PI) / 180;
}

const wrapRadians = (r: number) => ((r % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

export function resolveV2Uniforms(params: V2Params): V2Uniforms {
  const style = toV2Style(params.style);
  const d = V2_STYLE_DEFAULTS[style];
  const grain = params.grain === undefined ? d.grain : Math.min(1, Math.max(0, params.grain / 100));
  // The light turns with the field, so a rotated wallpaper is the same picture turned.
  const rotateRad = (wrapAngle(params.rotation ?? 0) * Math.PI) / 180;
  const light = compassToRadians(params.lightAngle ?? DEFAULT_COMPASS) - rotateRad;
  return {
    seed: params.seed >>> 0,
    colors: rampToFour(params.colors).flatMap(hexToRgb01),
    warp: d.warp,
    scale: d.scale,
    grain,
    light: d.light,
    lightAngleRad: rotateRad === 0 ? light : wrapRadians(light),
    style: V2_STYLE_INDEX[style],
    dither: params.dither === false ? 0 : 1,
    material: params.material ?? "none",
    rotateRad,
    toneExp: toneExponent(params.tone),
  };
}
