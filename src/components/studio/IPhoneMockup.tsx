import { useEffect, useRef } from "react";
import { useGradientCanvas } from "@/lib/useGradientCanvas";
import type { Colors4, Style } from "@/lib/palettes";
import { GrainOverlay } from "../ui/GrainOverlay";

const MOCKUP_SRC = "/assets/deviceMockups/iPhoneMockup.png";

/**
 * Screen rectangle inside the 1024×1024 PNG, expressed as percentages of
 * the image box. The PNG is a photograph of a hand holding an iPhone with
 * a black screen — these values position the live wallpaper canvas exactly
 * over that black region. Tuned visually; if the asset is replaced, these
 * need re-measuring.
 */
const SCREEN_RECT = {
  left: "31.5%",
  top: "13.5%",
  width: "30.5%",
  height: "63%",
  // iPhone screen rounded corners — small radius to match the device.
  borderRadius: "8%",
} as const;

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
 * generated wallpaper composited into the screen area. Includes a lock-screen
 * overlay (clock + date) so the wallpaper reads in real-world context.
 */
export function IPhoneMockup({ grain, source, colors, style, blur, seed }: Props) {
  return (
    <div
      className="relative shrink-0"
      style={{ aspectRatio: "1 / 1", maxHeight: "100%", maxWidth: "100%", height: "100%" }}
    >
      {/* Photographic frame — back layer. The iPhone's screen area is solid
          black; the wallpaper canvas above covers exactly that rectangle. */}
      <img
        src={MOCKUP_SRC}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
      />
      {/* Wallpaper screen + lock chrome — front layer, masked to the screen
          rect so the bezel/hand/desk in the photograph stay untouched. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: SCREEN_RECT.left,
          top: SCREEN_RECT.top,
          width: SCREEN_RECT.width,
          height: SCREEN_RECT.height,
          borderRadius: SCREEN_RECT.borderRadius,
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
        <LockChrome />
      </div>
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

function LockChrome() {
  return (
    <div
      className="absolute top-[8%] left-0 right-0 flex flex-col items-center text-white pointer-events-none"
      style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
    >
      <div className="font-sans text-[clamp(6px,1.6cqw,10px)] tracking-wider opacity-80 uppercase">
        Monday, April 20
      </div>
      <div
        className="font-sans font-light leading-none tracking-tight mt-[2%]"
        style={{ fontSize: "clamp(20px, 7cqw, 44px)", fontFeatureSettings: '"tnum"' }}
      >
        9:41
      </div>
    </div>
  );
}
