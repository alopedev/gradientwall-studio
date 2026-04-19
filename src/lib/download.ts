import { renderGradient, seedToHex } from "./gradient";
import { DEVICE_SIZES, type Device, type GradientConfig } from "./palettes";

type DownloadOpts = GradientConfig & { device: Device };

/**
 * Generate a full-resolution wallpaper with the current settings + grain overlay,
 * and trigger the browser download.
 *
 * Output format: WebP at 95% quality. For the grainy-gradient content GradientWall
 * produces, WebP 95% is visually indistinguishable from lossless while being ~5-6×
 * smaller than PNG. Falls back to JPEG 95% on browsers without WebP encoder support
 * (Safari < 14, old Edge).
 *
 * Resolutions are set in DEVICE_SIZES (Studio 5K tier).
 *
 * Returns a Promise that resolves once the download has been triggered, so the
 * caller can show a loading state during encode (≈400ms mobile, ≈1.4s desktop 5K).
 */
export async function downloadWallpaper(opts: DownloadOpts): Promise<void> {
  const d = DEVICE_SIZES[opts.device];
  const tmp = document.createElement("canvas");
  renderGradient(tmp, {
    w: d.w,
    h: d.h,
    colors: opts.colors,
    style: opts.style,
    blur: opts.blur,
    seed: opts.seed,
  });

  const ctx = tmp.getContext("2d");
  if (!ctx) return;

  // Grain overlay — the noise tile is identical between downloads, so we build it
  // once and reuse. Saves a 65k-iteration ImageData loop per click.
  ctx.globalAlpha = (opts.grain / 100) * 0.55;
  ctx.globalCompositeOperation = "overlay";
  const pattern = ctx.createPattern(getNoiseTile(), "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, d.w, d.h);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // Encode as WebP 95% (falls back to JPEG 95% if WebP unsupported).
  // Uses toBlob + ObjectURL — faster and more memory-friendly than toDataURL on
  // large canvases. Some browsers offload encoding off the main thread.
  const blob = await encodeBlob(tmp, "image/webp", 0.95);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = `gradientwall-${opts.device}-${seedToHex(opts.seed)}.${ext}`;
  a.href = url;
  a.click();
  // Revoke after click dispatches — browser already started the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let cachedNoiseTile: HTMLCanvasElement | null = null;
function getNoiseTile(): HTMLCanvasElement {
  if (cachedNoiseTile) return cachedNoiseTile;
  const tile = 256;
  const noise = document.createElement("canvas");
  noise.width = noise.height = tile;
  const nctx = noise.getContext("2d");
  if (!nctx) throw new Error("Cannot create noise tile");
  const id = nctx.createImageData(tile, tile);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 140;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  nctx.putImageData(id, 0, 0);
  cachedNoiseTile = noise;
  return noise;
}

function encodeBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.type === type) {
          resolve(blob);
        } else if (type !== "image/jpeg") {
          // WebP unsupported → fall back to JPEG 95%
          canvas.toBlob(
            (jpg) => (jpg ? resolve(jpg) : reject(new Error("Encode failed"))),
            "image/jpeg",
            quality,
          );
        } else {
          reject(new Error("Encode failed"));
        }
      },
      type,
      quality,
    );
  });
}
