import type { ComponentType } from "react";
import type { ExportedFile } from "@/lib/download/export";
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

export type ExportResult = ExportedFile;

export interface WallpaperEngine {
  id: string;
  /** Styles offered by the segmented control, in display order. */
  styles: readonly StyleOption[];
  /**
   * Sliders the Adjust panel offers for this wallpaper, in display order. They
   * depend on the params because a favorite saved with another renderer keeps
   * the sliders (and Reset defaults) of the renderer that draws it.
   */
  adjustmentsFor: (params: RenderParams) => readonly AdjustmentSpec[];
  /** Live preview. Fills its parent box, keeping the device aspect ratio. */
  Canvas: ComponentType<EngineCanvasProps>;
  /**
   * Optional layer drawn over `Canvas` with the same look, drifting slowly (the
   * hero phone and the Studio device). It renders nothing when it can't move;
   * an engine without one leaves the still canvas on its own.
   */
  Motion?: ComponentType<{ params: RenderParams }>;
  /** Synchronous small render for the favorites strip and gradient pack covers. */
  paintThumbnail: (
    canvas: HTMLCanvasElement,
    params: RenderParams,
    size: { w: number; h: number },
  ) => void;
  /** File format a download will have in this browser ("WebP", or "JPEG" without a WebP encoder). */
  exportFormat: () => string;
  /** Full-resolution render + encode + save. */
  exportWallpaper: (
    params: RenderParams,
    device: Device,
    onProgress?: ExportProgress,
  ) => Promise<ExportResult>;
}
