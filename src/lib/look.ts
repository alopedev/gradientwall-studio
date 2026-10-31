import {
  activeColors,
  ALL_ACTIVE,
  DEFAULT_CONTRAST,
  DEFAULT_DENSITY,
  DEFAULT_LIGHT_ANGLE,
  DEFAULT_MATERIAL,
  DEFAULT_ROTATION,
  DEFAULT_TONE,
  DEFAULT_VIBRANCE,
  engineOf,
  type ActiveMask,
  type Colors4,
  type Engine,
  type GradientConfig,
  type Material,
  type RenderParams,
  type Style,
} from "@/lib/palettes";
import type { SharedLook } from "@/lib/look-url";

/**
 * A "look" is everything that draws the wallpaper on screen, with every field
 * concrete: the live Studio holds one (`useConfigStore`), a favorite stores one
 * (with optional fields, see `FavoriteConfig`), the renderer takes one
 * (`RenderParams`, with the color mask already applied).
 *
 * This file is the only place that translates between those three shapes. Adding
 * a render parameter means one edit here (the compiler flags every function
 * below that forgets it) instead of one per component.
 *
 * Pure: no React, no stores.
 */
export interface Look {
  engine: Engine;
  colors: Colors4;
  active: ActiveMask;
  style: Style;
  blur: number;
  grain: number;
  seed: number;
  lightAngle: number;
  density: number;
  contrast: number;
  vibrance: number;
  material: Material;
  rotation: number;
  tone: number;
}

/** What a favorite persists. Fields added after the first release are optional. */
export type FavoriteConfig = GradientConfig & { active?: ActiveMask };

/** Copy of the look fields out of anything that carries them (e.g. the whole store state). */
export function pickLook(s: Look): Look {
  return {
    engine: s.engine,
    colors: s.colors,
    active: s.active,
    style: s.style,
    blur: s.blur,
    grain: s.grain,
    seed: s.seed,
    lightAngle: s.lightAngle,
    density: s.density,
    contrast: s.contrast,
    vibrance: s.vibrance,
    material: s.material,
    rotation: s.rotation,
    tone: s.tone,
  };
}

/** Renderer input: the color mask is resolved into a 2..4 color ramp. */
export function toRenderParams(look: Look): RenderParams {
  return {
    engine: look.engine,
    colors: activeColors(look.colors, look.active),
    style: look.style,
    blur: look.blur,
    grain: look.grain,
    seed: look.seed,
    lightAngle: look.lightAngle,
    density: look.density,
    contrast: look.contrast,
    vibrance: look.vibrance,
    material: look.material,
    rotation: look.rotation,
    tone: look.tone,
  };
}

/** Snapshot to persist as a favorite. Arrays are copied so later edits don't leak in. */
export function toFavoriteConfig(look: Look): FavoriteConfig {
  return {
    engine: look.engine,
    colors: [...look.colors] as Colors4,
    active: [...look.active] as ActiveMask,
    style: look.style,
    blur: look.blur,
    grain: look.grain,
    seed: look.seed,
    lightAngle: look.lightAngle,
    density: look.density,
    contrast: look.contrast,
    vibrance: look.vibrance,
    material: look.material,
    rotation: look.rotation,
    tone: look.tone,
  };
}

/**
 * Favorite → look. Fields missing from older favorites take the same defaults
 * everywhere (loading it into the stage, painting its thumbnail, comparing it
 * with the stage), and `engine` absent means v1 so those keep rendering as saved.
 */
export function fromFavorite(config: FavoriteConfig): Look {
  return {
    engine: engineOf(config),
    colors: [...config.colors] as Colors4,
    active: [...(config.active ?? ALL_ACTIVE)] as ActiveMask,
    style: config.style,
    blur: config.blur,
    grain: config.grain,
    seed: config.seed,
    lightAngle: config.lightAngle ?? DEFAULT_LIGHT_ANGLE,
    density: config.density ?? DEFAULT_DENSITY,
    contrast: config.contrast ?? DEFAULT_CONTRAST,
    vibrance: config.vibrance ?? DEFAULT_VIBRANCE,
    material: config.material ?? DEFAULT_MATERIAL,
    rotation: config.rotation ?? DEFAULT_ROTATION,
    tone: config.tone ?? DEFAULT_TONE,
  };
}

const sameList = (a: readonly (string | boolean)[], b: readonly (string | boolean)[]) =>
  a.length === b.length &&
  a.every((v, i) => String(v).toLowerCase() === String(b[i]).toLowerCase());

/** True when two looks would draw the same wallpaper: every field matches. */
export function isSameLook(a: Look, b: Look): boolean {
  return (
    a.engine === b.engine &&
    sameList(a.colors, b.colors) &&
    sameList(a.active, b.active) &&
    a.style === b.style &&
    a.blur === b.blur &&
    a.grain === b.grain &&
    a.seed === b.seed &&
    a.lightAngle === b.lightAngle &&
    a.density === b.density &&
    a.contrast === b.contrast &&
    a.vibrance === b.vibrance &&
    a.material === b.material &&
    a.rotation === b.rotation &&
    a.tone === b.tone
  );
}

/** A look from a link (`lib/look-url`) on top of the current one: drawn by v2, all four colours on, no material, turn or tone unless the link names them. */
export function withSharedLook(look: Look, shared: SharedLook): Look {
  return {
    ...look,
    engine: "v2",
    colors: [...shared.colors] as Colors4,
    active: [...ALL_ACTIVE] as ActiveMask,
    style: shared.style,
    seed: shared.seed,
    lightAngle: shared.lightAngle,
    grain: shared.grain,
    material: shared.material ?? DEFAULT_MATERIAL,
    rotation: shared.rotation ?? DEFAULT_ROTATION,
    tone: shared.tone ?? DEFAULT_TONE,
  };
}
