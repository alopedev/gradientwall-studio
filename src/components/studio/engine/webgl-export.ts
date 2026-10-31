import { exportCanvas, type ExportedFile } from "@/lib/download/export";
import type { Sink } from "@/lib/download/sink";
import { renderWallpaperV2, type V2Params, type V2Renderer } from "@/lib/gradient-v2";
import { DEVICE_SIZES, type Device } from "@/lib/palettes";
import type { ExportProgress } from "./types";

export interface V2ExportOptions {
  seed: number;
  sink?: Sink;
  supported?: () => boolean;
  renderer?: () => V2Renderer;
  onProgress?: ExportProgress;
}

/**
 * The v2 Download: render at the device size, encode, save. Loaded on the first
 * Download (or ahead of it), not with the page. `null` when the GPU path can't
 * run, so the engine can export with v1 instead.
 */
export function exportV2(
  params: V2Params,
  device: Device,
  { seed, sink, supported, renderer, onProgress }: V2ExportOptions,
): Promise<ExportedFile | null> {
  const size = DEVICE_SIZES[device];
  return exportCanvas(() => renderWallpaperV2(params, size.w, size.h, { supported, renderer }), {
    device,
    seed,
    sink,
    onProgress,
  });
}

export type V2Exporter = { exportV2: typeof exportV2 };
