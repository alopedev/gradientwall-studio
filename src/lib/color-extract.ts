import type { Colors4 } from "./palettes";

/**
 * Extract the 4 dominant colors from an image file using a simple k-means
 * clustering on a downsampled RGB space. Fully client-side, no network.
 *
 * Pipeline:
 *   1. Decode file via createImageBitmap
 *   2. Draw onto a 96×96 canvas (≈ 9k pixels — plenty of resolution for
 *      color extraction, k-means converges in <20ms)
 *   3. Read pixel data, drop near-transparent pixels
 *   4. k-means with k=4 and 10 iterations (more than enough on 9k points)
 *   5. Sort clusters by luminance so the output is a dark→light ramp,
 *      matching GradientWall's convention (colors[0] = darkest = background)
 *   6. Return hex strings
 *
 * If the image has fewer than 4 distinct color clusters (e.g. a monochrome
 * PNG), later centroids land near the earlier ones — the user can adjust
 * via the color picker swatches.
 */
export async function extractColorsFromFile(file: File): Promise<Colors4> {
  const bitmap = await createImageBitmap(file);
  try {
    return extractColorsFromBitmap(bitmap);
  } finally {
    bitmap.close?.();
  }
}

export function extractColorsFromBitmap(bitmap: ImageBitmap | HTMLImageElement): Colors4 {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  return extractFromPixels(data);
}

/**
 * Pure core: given a flat RGBA pixel buffer, return the 4 dominant colors
 * as `#RRGGBB` hex strings, sorted dark → light by BT.709 luminance.
 *
 * Pixels with alpha < 128 are dropped before clustering. Throws if no
 * opaque pixels remain.
 *
 * This is the testable entry point — `extractColorsFromBitmap` wraps this
 * with a 96×96 Canvas downsample step.
 */
export function extractFromPixels(data: Uint8ClampedArray): Colors4 {
  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) throw new Error("Image has no opaque pixels");

  const centroids = kmeans(pixels, 4, 10);
  centroids.sort(byLuminance);
  return centroids.map(rgbToHex) as Colors4;
}

type RGB = [number, number, number];

function byLuminance(a: RGB, b: RGB): number {
  return luminance(a) - luminance(b);
}

function luminance([r, g, b]: RGB): number {
  // ITU-R BT.709 weights — good enough for clustering-order decisions
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbToHex([r, g, b]: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function sqDist(a: RGB, b: RGB): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/**
 * Plain Lloyd's k-means with k-means++ seeding. Operates in RGB space
 * (no LAB conversion — k=4 on 9k points doesn't need the extra perceptual
 * accuracy and the added complexity isn't worth it for a display feature).
 */
export function kmeans(points: RGB[], k: number, iterations: number): RGB[] {
  const centroids = kmeansPlusPlusSeed(points, k);

  for (let iter = 0; iter < iterations; iter++) {
    const buckets: RGB[][] = Array.from({ length: k }, () => []);
    for (const p of points) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let ci = 0; ci < k; ci++) {
        const d = sqDist(p, centroids[ci]);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = ci;
        }
      }
      buckets[bestIdx].push(p);
    }
    for (let ci = 0; ci < k; ci++) {
      if (buckets[ci].length === 0) continue; // keep previous centroid if bucket empty
      let r = 0,
        g = 0,
        b = 0;
      for (const p of buckets[ci]) {
        r += p[0];
        g += p[1];
        b += p[2];
      }
      centroids[ci] = [r / buckets[ci].length, g / buckets[ci].length, b / buckets[ci].length];
    }
  }
  return centroids;
}

/**
 * k-means++ seeding: pick centroids spread out across the point cloud.
 * Produces much better clustering than random seeding when k is small.
 */
function kmeansPlusPlusSeed(points: RGB[], k: number): RGB[] {
  const chosen: RGB[] = [points[Math.floor(Math.random() * points.length)]];
  while (chosen.length < k) {
    const distances = points.map((p) => Math.min(...chosen.map((c) => sqDist(p, c))));
    const sum = distances.reduce((s, d) => s + d, 0);
    if (sum === 0) {
      // All remaining points coincide with chosen centroids — just duplicate
      chosen.push([...chosen[chosen.length - 1]]);
      continue;
    }
    let target = Math.random() * sum;
    for (let i = 0; i < points.length; i++) {
      target -= distances[i];
      if (target <= 0) {
        chosen.push([...points[i]]);
        break;
      }
    }
  }
  return chosen;
}
