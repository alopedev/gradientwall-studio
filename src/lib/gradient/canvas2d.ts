import type { GradientSpec } from "./spec";

/**
 * Paint a GradientSpec onto an HTMLCanvasElement via Canvas 2D.
 * Sets canvas.width/height to spec.w/h, paints the background, then each layer
 * with a shared `filter: blur(Npx)` applied.
 *
 * This is the only module in `lib/gradient/` that touches the DOM/Canvas API.
 */
export function paintSpecToCanvas(canvas: HTMLCanvasElement, spec: GradientSpec): void {
  canvas.width = spec.w;
  canvas.height = spec.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = spec.background;
  ctx.fillRect(0, 0, spec.w, spec.h);

  ctx.filter = `blur(${spec.blurPx}px)`;
  for (const layer of spec.layers) {
    const fill = layer.fill;
    if (fill.kind === "solid") {
      ctx.fillStyle = fill.color;
    } else {
      const g = ctx.createRadialGradient(fill.cx, fill.cy, 0, fill.cx, fill.cy, fill.r);
      for (const stop of fill.stops) {
        g.addColorStop(stop.offset, stop.color);
      }
      ctx.fillStyle = g;
    }
    ctx.fillRect(0, 0, spec.w, spec.h);
  }
  ctx.filter = "none";
}
