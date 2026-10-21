import type { Device } from "../palettes";
import { encodeWithFallback, exportFormatLabel, type EncodeFormat } from "./encode";
import { wallpaperFilename } from "./filename";
import { defaultSink, type Sink } from "./sink";

/**
 * WebP 95 %, JPEG 95 % where the browser has no WebP encoder. For grainy
 * gradients WebP 95 % looks the same as lossless at a fraction of PNG's size.
 */
const FORMATS: EncodeFormat[] = [
  { type: "image/webp", quality: 0.95 },
  { type: "image/jpeg", quality: 0.95 },
];

export interface ExportedFile {
  filename: string;
  bytes: number;
}

export interface ExportCanvasOptions {
  device: Device;
  seed: number;
  /** Where the file goes. Default: the share sheet on iOS, a download elsewhere. */
  sink?: Sink;
  /** Called with 0..1 as the export moves from stage to stage. */
  onProgress?: (fraction: number) => void;
}

/** Let the browser paint the progress bar before the next heavy synchronous step. */
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** "WebP" or "JPEG": what `exportCanvas` will write in this browser. */
export function exportFormat(): string {
  return exportFormatLabel(FORMATS);
}

/**
 * Render → encode → save, the Download button's whole pipeline. Each engine
 * passes only its own `render` step. Rendering is one synchronous call, so
 * progress moves by stage rather than by pixel: render ≈ 60 %, encode ≈ 35 %,
 * hand-off the rest.
 *
 * Answers `null` without saving when `render` gives no canvas (the GPU path
 * couldn't run), so the caller can try another renderer.
 */
export async function exportCanvas(
  render: () => HTMLCanvasElement | null,
  { device, seed, sink = defaultSink, onProgress }: ExportCanvasOptions,
): Promise<ExportedFile | null> {
  onProgress?.(0.05);
  await nextFrame();
  const canvas = render();
  if (!canvas) return null;
  onProgress?.(0.65);
  await nextFrame();
  const { blob, ext } = await encodeWithFallback(canvas, FORMATS);
  onProgress?.(0.95);
  const filename = wallpaperFilename(device, seed, ext);
  await sink(blob, filename);
  onProgress?.(1);
  return { filename, bytes: blob.size };
}
