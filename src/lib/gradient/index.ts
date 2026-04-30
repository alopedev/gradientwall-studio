import { buildGradientSpec, type SpecOpts } from "./spec";
import { paintSpecToCanvas } from "./canvas2d";

// Spec-level exports (pure, no DOM) — prefer these for new code.
export {
  buildGradientSpec,
  mulberry32,
  seedToHex,
  hslToHex,
  hexToHsl,
  randomColors,
  type GradientSpec,
  type SpecOpts,
  type Layer,
  type RadialFill,
  type SolidFill,
  type Stop,
} from "./spec";

// Canvas adapter.
export { paintSpecToCanvas } from "./canvas2d";

// Legacy alias: RenderOpts = SpecOpts. Existing consumers (download.ts,
// useGradientCanvas.ts, Preview.tsx) keep working unchanged.
export type RenderOpts = SpecOpts;

/**
 * Convenience wrapper: build spec + paint in one call.
 * Prefer `buildGradientSpec` + `paintSpecToCanvas` in new code when you need
 * to inspect or transform the spec before painting.
 */
export function renderGradient(canvas: HTMLCanvasElement, opts: SpecOpts): void {
  paintSpecToCanvas(canvas, buildGradientSpec(opts));
}
