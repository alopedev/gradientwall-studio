import type { ComponentType } from "react";
import type { Device, RenderParams, Style } from "@/lib/palettes";

/**
 * Contract between the Studio UI and whatever draws the wallpapers.
 *
 * The UI (stage, dock, favorites, export) only talks to a `WallpaperEngine`.
 * Today the only implementation wraps the Canvas2D pipeline in `src/lib/gradient`;
 * the WebGL v2 engine can plug in by providing another object that satisfies this
 * interface — no UI change needed.
 */

/** Numeric knobs the "Adjust" panel can expose. Keys match fields of `RenderParams`. */
export type AdjustmentKey = "blur" | "grain" | "lightAngle" | "contrast" | "vibrance";

export interface AdjustmentSpec {
  key: AdjustmentKey;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Value "Reset" restores. */
  default: number;
  /** Text shown next to the slider (and in the drag bubble). */
  format: (value: number) => string;
}

export interface StyleOption {
  id: Style;
  label: string;
}

export interface EngineCanvasProps {
  params: RenderParams;
  device: Device;
  className?: string;
  /**
   * Called with the live canvas right before it is repainted with new params
   * (never on the first paint). The stage uses it to snapshot the previous
   * frame for the reveal transition.
   */
  onBeforePaint?: (canvas: HTMLCanvasElement) => void;
}

/** Called with a number in 0..1 as the export advances. */
export type ExportProgress = (fraction: number) => void;

export interface ExportResult {
  filename: string;
  bytes: number;
}

export interface WallpaperEngine {
  id: string;
  /** Styles offered by the segmented control, in display order. */
  styles: readonly StyleOption[];
  /** Sliders offered by the Adjust panel, in display order. */
  adjustments: readonly AdjustmentSpec[];
  /** Live preview. Fills its parent box, keeping the device aspect ratio. */
  Canvas: ComponentType<EngineCanvasProps>;
  /** Synchronous small render for the favorites strip. */
  paintThumbnail: (
    canvas: HTMLCanvasElement,
    params: RenderParams,
    size: { w: number; h: number },
  ) => void;
  /** Full-resolution render + encode + save. */
  exportWallpaper: (
    params: RenderParams,
    device: Device,
    onProgress?: ExportProgress,
  ) => Promise<ExportResult>;
}
