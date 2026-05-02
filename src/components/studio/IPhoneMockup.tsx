import { useEffect, useRef } from "react";
import { useGradientCanvas } from "@/lib/useGradientCanvas";
import type { Colors4, Style } from "@/lib/palettes";
import { detectScreenRect } from "@/lib/screenRect";
import { GrainOverlay } from "../ui/GrainOverlay";

const MOCKUP_SRC = "/assets/deviceMockups/iPhoneMockup.png";

/**
 * Screen geometry measured against the 1024×1024 PNG by
 * `/tmp/find_screen_corners.py`:
 *  - `PNG_CORNERS` are tangent points on the rounded screen curves (used
 *    only for the rotation angle — long-side edges).
 *  - `PNG_AABB` is the axis-aligned bounding box of the flood-filled
 *    near-black region (used for width/height; tangent to the rect's
 *    straight edges, so robust to corner radius).
 * Re-run the script if the asset is replaced.
 */
const PNG_SIZE = { w: 1024, h: 1024 } as const;
const PNG_CORNERS = {
  tl: { x: 373, y: 203 },
  tr: { x: 635, y: 205 },
  bl: { x: 425, y: 820 },
  br: { x: 682, y: 797 },
} as const;
const PNG_AABB = { minX: 359, minY: 184, maxX: 698, maxY: 830 } as const;

// `detectScreenRect` drives the wallpaper's rotation + position so the
// gradient inherits the device's tilt. The asset PNG carries an alpha mask
// over the screen pixels (see `/tmp/cutout_screen.py`); the wallpaper
// renders BEHIND the PNG and shows through the transparent screen area
// exactly. The rect is expanded slightly past the detected screen so the
// alpha hole is always covered — no need for pixel-perfect dimensions.
const SCREEN = detectScreenRect(PNG_CORNERS, PNG_AABB, PNG_SIZE.w, PNG_SIZE.h);
/** % padding added on each side of the wallpaper rect so the alpha hole is
 *  fully covered even with sub-pixel detection error. The PNG mask trims
 *  any overflow. */
const SCREEN_OVERSCAN_PCT = 3;

interface Props {
  grain: number;
  /**
   * Optional shared source canvas already containing the wallpaper. Used by
   * the Preview to avoid double-rendering when the same wallpaper is shown
   * on both screen and download paths. When omitted, the standalone props
   * (`colors/style/blur/seed`) drive an in-component render.
   */
  source?: HTMLCanvasElement | null;
  colors?: Colors4;
  style?: Style;
  blur?: number;
  seed?: number;
}

/**
 * Photographic iPhone mockup — a real hand-held device shot with the
 * generated wallpaper composited into the screen area through the asset
 * PNG's alpha mask.
 */
export function IPhoneMockup({ grain, source, colors, style, blur, seed }: Props) {
  return (
    <div
      className="relative shrink-0"
      style={{ aspectRatio: "1 / 1", maxHeight: "100%", maxWidth: "100%", height: "100%" }}
    >
      {/* Wallpaper — BACK layer. Sized + rotated to match the phone's tilt
          so the gradient looks "displayed on the device", expanded by
          SCREEN_OVERSCAN_PCT on each side so the alpha hole is fully
          covered even with sub-pixel detection error. */}
      <div
        className="absolute"
        style={{
          left: `${SCREEN.leftPct - SCREEN_OVERSCAN_PCT}%`,
          top: `${SCREEN.topPct - SCREEN_OVERSCAN_PCT}%`,
          width: `${SCREEN.widthPct + SCREEN_OVERSCAN_PCT * 2}%`,
          height: `${SCREEN.heightPct + SCREEN_OVERSCAN_PCT * 2}%`,
          transform: `rotate(${SCREEN.rotateDeg}deg)`,
          transformOrigin: "center",
        }}
      >
        {source !== undefined ? (
          <SharedSourceCanvas source={source} />
        ) : (
          <>
            <OwnCanvas colors={colors!} style={style!} blur={blur!} seed={seed!} />
            <GrainOverlay amount={grain} />
          </>
        )}
      </div>
      {/* Photographic frame — FRONT layer. The screen pixels are alpha=0
          (see /tmp/cutout_screen.py), acting as a cookie-cutter mask over
          the wallpaper. Pixel-perfect alignment by construction: whatever
          the photo shows as screen, that's what the wallpaper fills. */}
      <img
        src={MOCKUP_SRC}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
      />
    </div>
  );
}

/** Blits the shared rendered wallpaper into a display canvas via drawImage. */
function SharedSourceCanvas({ source }: { source: HTMLCanvasElement | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const dst = ref.current;
    if (!dst || !source) return;
    dst.width = source.width;
    dst.height = source.height;
    dst.getContext("2d")?.drawImage(source, 0, 0);
  }, [source]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

/** Standalone path: render gradient on our own canvas (tests / demos). */
function OwnCanvas({ colors, style, blur, seed }: { colors: Colors4; style: Style; blur: number; seed: number }) {
  const ref = useGradientCanvas({ w: 360, h: 800, colors, style, blur, seed }, [colors, style, blur, seed]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}
