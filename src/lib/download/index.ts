import { seedToHex } from "../gradient";
import { DEVICE_SIZES, type Device, type GradientConfig } from "../palettes";
import type { ColorRamp } from "../gradient/spec";
import { composeWallpaper } from "./compose";
import { encodeWithFallback, type EncodeFormat } from "./encode";
import { browserDownloadSink, type Sink } from "./sink";

export type { Sink } from "./sink";
export type { EncodeFormat, EncodedImage } from "./encode";
export { browserDownloadSink } from "./sink";
export { composeWallpaper } from "./compose";
export { encodeWithFallback } from "./encode";

// Accepts the post-filter color ramp — the caller (Preview) resolves the
// `active` mask and passes a 2-to-4 length array.
type DownloadOpts = Omit<GradientConfig, "colors"> & { device: Device; colors: ColorRamp };

const DEFAULT_FORMATS: EncodeFormat[] = [
  { type: "image/webp", quality: 0.95 },
  { type: "image/jpeg", quality: 0.95 },
];

/**
 * Generate a Studio-5K-tier wallpaper (WebP 95%, JPEG 95% fallback) and
 * send it to the sink. The default sink triggers a browser download.
 *
 * For GradientWall's grainy-gradient content, WebP 95% is visually
 * indistinguishable from lossless while being ~5-6× smaller than PNG.
 *
 * Pass a different `sink` (e.g. a cloud-upload impl) to save elsewhere.
 */
export async function downloadWallpaper(opts: DownloadOpts, sink: Sink = browserDownloadSink): Promise<void> {
  const d = DEVICE_SIZES[opts.device];
  const canvas = composeWallpaper({
    w: d.w,
    h: d.h,
    colors: opts.colors,
    style: opts.style,
    blur: opts.blur,
    grain: opts.grain,
    seed: opts.seed,
  });
  const { blob, ext } = await encodeWithFallback(canvas, DEFAULT_FORMATS);
  await sink(blob, `gradientwall-${opts.device}-${seedToHex(opts.seed)}.${ext}`);
}
