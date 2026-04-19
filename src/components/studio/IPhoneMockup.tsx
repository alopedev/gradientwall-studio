import { useEffect, useRef } from "react";
import { useGradientCanvas } from "@/lib/useGradientCanvas";
import type { Colors4, Style } from "@/lib/palettes";
import { GrainOverlay } from "../ui/GrainOverlay";

interface Props {
  variant: "lock" | "home";
  grain: number; // 0-100 — display overlay opacity
  /**
   * Optional shared source canvas already containing the wallpaper. When
   * provided, this component skips its own gradient render and blits from
   * the source via drawImage — lets sibling mockups share a single render
   * pass instead of each painting the identical gradient independently.
   *
   * When omitted, `colors/style/blur/seed` must be provided and the
   * component renders its own canvas (useful for standalone demos/tests).
   */
  source?: HTMLCanvasElement | null;
  colors?: Colors4;
  style?: Style;
  blur?: number;
  seed?: number;
}

/**
 * A stylized iPhone frame rendering the current wallpaper behind UI chrome.
 *
 * Two variants:
 *  - "lock"  — large clock centered near the top with date above
 *  - "home"  — translucent 4×5 app-icon grid
 *
 * Both share: rounded bezel, dynamic-island pill, top status bar.
 * Zero real app icons or Apple marks — only neutral placeholders.
 */
export function IPhoneMockup({ variant, grain, source, colors, style, blur, seed }: Props) {
  return (
    <div
      className="relative"
      style={{ aspectRatio: "9 / 19.5", maxHeight: "100%", maxWidth: "100%", height: "100%" }}
    >
      {/* Outer body / bezel — subtle metallic gradient */}
      <div className="absolute inset-0 rounded-[14%/7.5%] p-[3px] bg-gradient-to-b from-neutral-600 via-neutral-800 to-neutral-950 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        {/* Screen */}
        <div className="relative w-full h-full rounded-[13%/7%] overflow-hidden bg-black">
          {source !== undefined ? (
            <SharedSourceCanvas source={source} />
          ) : (
            <>
              <OwnCanvas colors={colors!} style={style!} blur={blur!} seed={seed!} />
              {/* Shared-source path bakes grain into the source canvas; here we overlay it. */}
              <GrainOverlay amount={grain} />
            </>
          )}

          {/* Dynamic island */}
          <div className="absolute top-[1.8%] left-1/2 -translate-x-1/2 w-[32%] h-[2.4%] bg-black rounded-full" />

          {/* Status bar — time left, cell/wifi/battery right */}
          <div
            className="absolute top-[1.7%] left-0 right-0 flex justify-between items-center px-[8%] text-white pointer-events-none"
            style={{ fontSize: "clamp(7px, 1.8cqw, 10px)" }}
          >
            <span className="font-semibold tracking-tight">9:41</span>
            <span className="font-semibold flex items-center gap-1 tracking-tight">
              <span aria-hidden>•••</span>
              <span aria-hidden>◐</span>
            </span>
          </div>

          {variant === "lock" ? <LockChrome /> : <HomeChrome />}
        </div>
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

/** Fallback path: render gradient on our own canvas (standalone use). */
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
        style={{ fontSize: "clamp(34px, 11cqw, 68px)", fontFeatureSettings: '"tnum"' }}
      >
        9:41
      </div>
    </div>
  );
}

function HomeChrome() {
  return (
    <div
      className="absolute inset-0 flex items-end pointer-events-none"
      style={{ paddingBottom: "6%", paddingLeft: "6%", paddingRight: "6%" }}
    >
      <div className="grid grid-cols-4 gap-[8%] w-full" style={{ aspectRatio: "4/5" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[26%] bg-white/15 backdrop-blur-[2px] border border-white/10"
          />
        ))}
      </div>
    </div>
  );
}
