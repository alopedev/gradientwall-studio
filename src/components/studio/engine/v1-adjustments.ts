import {
  DEFAULT_CONTRAST,
  DEFAULT_LIGHT_ANGLE,
  STUDIO_BLUR,
  STUDIO_VIBRANCE,
  V1_DEFAULT_GRAIN,
} from "@/lib/defaults";
import type { AdjustmentSpec } from "./types";

/**
 * Sliders of the Canvas2D (v1) pipeline: the full set, since v1 renders every
 * one of them. Plain data, so the v2 engine can offer them for a v1 favorite
 * without loading the v1 renderer.
 */
export const V1_ADJUSTMENTS: readonly AdjustmentSpec[] = [
  {
    key: "blur",
    label: "Softness",
    min: 10,
    max: 120,
    step: 1,
    default: STUDIO_BLUR,
    format: (v) => `${Math.round(v)}`,
  },
  {
    key: "grain",
    label: "Grain",
    min: 0,
    max: 100,
    step: 1,
    default: V1_DEFAULT_GRAIN,
    format: (v) => `${Math.round(v)}%`,
  },
  {
    key: "lightAngle",
    label: "Light",
    min: 0,
    max: 360,
    step: 1,
    default: DEFAULT_LIGHT_ANGLE,
    format: (v) => `${Math.round(v)}°`,
  },
  {
    key: "contrast",
    label: "Contrast",
    min: 0.5,
    max: 1.5,
    step: 0.01,
    default: DEFAULT_CONTRAST,
    format: (v) => v.toFixed(2),
  },
  {
    key: "vibrance",
    label: "Vibrance",
    min: 0.5,
    max: 1.5,
    step: 0.01,
    default: STUDIO_VIBRANCE,
    format: (v) => v.toFixed(2),
  },
];
