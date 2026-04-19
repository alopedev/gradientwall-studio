import type { Colors4, Style } from "./palettes";

/**
 * Seeded PRNG — mulberry32.
 * Ported 1:1 from the original vanilla prototype.
 */
export function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedToHex(s: number): string {
  return "#" + (s & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return "#" + f(0) + f(8) + f(4);
}

export interface RenderOpts {
  w: number;
  h: number;
  colors: Colors4;
  style: Style;
  blur: number;
  seed: number;
}

/**
 * Render a mesh / blobs / liquid gradient into a canvas.
 * Ported from the original renderGradient() of the vanilla prototype,
 * preserving pixel-level behaviour so output matches 1:1.
 */
export function renderGradient(canvas: HTMLCanvasElement, opts: RenderOpts): void {
  const { w, h, colors, style, blur, seed } = opts;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rand = mulberry32(seed);

  // Background = darkest color
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);

  const blurPx = (blur / 100) * Math.min(w, h) * 0.35;
  ctx.filter = `blur(${blurPx}px)`;

  if (style === "mesh") {
    const points = colors.map((c, i) => ({
      color: c,
      x: (0.25 + rand() * 0.5) * w * (i % 2 === 0 ? 0.7 : 1.3) * 0.8 + (i % 2) * w * 0.3,
      y: (0.15 + i / colors.length) * h + (rand() - 0.5) * h * 0.2,
      r: Math.min(w, h) * (0.55 + rand() * 0.35),
    }));
    for (const p of points) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.color);
      g.addColorStop(1, p.color + "00");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (style === "blobs") {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const c = colors[i % colors.length];
      const x = rand() * w;
      const y = rand() * h;
      const r = Math.min(w, h) * (0.2 + rand() * 0.3);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c);
      g.addColorStop(1, c + "00");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (style === "liquid") {
    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const c = colors[i % colors.length];
      const y = (i / bands) * h + (rand() - 0.5) * h * 0.3;
      const x = rand() * w;
      const g = ctx.createRadialGradient(x, y, 0, x, y, w * (0.7 + rand() * 0.5));
      g.addColorStop(0, c + "cc");
      g.addColorStop(1, c + "00");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    const hx = w * 0.5;
    const hy = h * 0.3;
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.min(w, h) * 0.5);
    hg.addColorStop(0, "rgba(255,255,255,0.25)");
    hg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.filter = "none";
}

/**
 * Generate an HSL-based 4-color set with dark/mid/mid/light distribution.
 * Used by the Random button. Ported from vanilla prototype.
 */
export function randomColors(): Colors4 {
  const hueBase = Math.random() * 360;
  const offsets = [0, 40 + Math.random() * 30, 150 + Math.random() * 40, 250 + Math.random() * 40];
  const lights = [14, 32, 60, 82];
  const sats = [55, 70, 78, 72];
  return offsets.map((off, i) => {
    const h = (hueBase + off) % 360;
    return hslToHex(h, sats[i], lights[i]);
  }) as Colors4;
}
