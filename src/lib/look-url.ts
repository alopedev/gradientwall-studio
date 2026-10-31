import { MATERIALS, type Colors4, type Material } from "./palettes";
import { clampTone } from "./tone";

/**
 * A wallpaper in a link: `?w=liquid-1234-2b1055.7597de.ff6e7f.ffd86e-315-45`
 * (style, seed, four colours, light angle, grain), then optional parts in any
 * order: the material (`…-45-fluted`), a turn (`…-45-r90`) and a tone, lighter
 * `l<n>` or darker `d<n>` (`…-45-d30`), each left out at its default. Enough to redraw a v2 wallpaper exactly, so a
 * gallery image or a pin can open it in the Studio.
 *
 * Pure: no React, no stores. A value that doesn't parse reads as `null`, so a
 * mangled link just opens the page as usual.
 */
export interface SharedLook {
  style: "mesh" | "liquid" | "aurora";
  seed: number;
  colors: Colors4;
  lightAngle: number;
  grain: number;
  /** Absent = "none"; links made before materials have no such part. */
  material?: Material;
  /** Clockwise degrees. Absent = 0. */
  rotation?: number;
  /** −100 (darker) .. 100 (lighter). Absent = 0. */
  tone?: number;
}

export const LOOK_PARAM = "w";

const SHARED_STYLES = ["mesh", "liquid", "aurora"] as const;
const HEX = /^[0-9a-f]{6}$/i;
const INT = /^\d+$/;

export function encodeLookParam(look: SharedLook): string {
  const colors = look.colors.map((c) => c.replace("#", "").toLowerCase()).join(".");
  const parts = [
    look.style,
    look.seed,
    colors,
    Math.round(look.lightAngle),
    Math.round(look.grain),
  ];
  if (look.material && look.material !== "none") parts.push(look.material);
  const turn = Math.round(look.rotation ?? 0) % 360;
  if (turn > 0) parts.push(`r${turn}`);
  const tone = clampTone(look.tone ?? 0);
  if (tone !== 0) parts.push(`${tone > 0 ? "l" : "d"}${Math.abs(tone)}`);
  return parts.join("-");
}

export function decodeLookParam(value: string): SharedLook | null {
  const parts = value.split("-");
  if (parts.length < 5 || parts.length > 8) return null;
  const [style, seed, colors, light, grain, ...extra] = parts;
  let material: Material | undefined;
  let rotation: number | undefined;
  let tone: number | undefined;
  for (const part of extra) {
    const turn = /^r(\d+)$/.exec(part);
    const shade = /^([ld])(\d+)$/.exec(part);
    if (turn && rotation === undefined && Number(turn[1]) < 360) rotation = Number(turn[1]);
    else if (shade && tone === undefined && Number(shade[2]) <= 100)
      tone = (shade[1] === "l" ? 1 : -1) * Number(shade[2]);
    else if (!material && (MATERIALS as readonly string[]).includes(part))
      material = part as Material;
    else return null;
  }
  if (!SHARED_STYLES.includes(style as SharedLook["style"])) return null;
  if (![seed, light, grain].every((n) => INT.test(n))) return null;
  const hexes = colors.split(".");
  if (hexes.length !== 4 || !hexes.every((h) => HEX.test(h))) return null;
  const lightAngle = Number(light);
  const grainValue = Number(grain);
  if (lightAngle > 360 || grainValue > 100) return null;
  return {
    style: style as SharedLook["style"],
    seed: Number(seed),
    colors: hexes.map((h) => `#${h.toLowerCase()}`) as Colors4,
    lightAngle,
    grain: grainValue,
    ...(material && material !== "none" ? { material } : {}),
    ...(rotation ? { rotation } : {}),
    ...(tone ? { tone } : {}),
  };
}

/** `?w=…` link to a page (a path with its trailing slash) that opens on the Studio. */
export function lookHref(path: string, look: SharedLook): string {
  return `${path}?${LOOK_PARAM}=${encodeLookParam(look)}#studio`;
}
