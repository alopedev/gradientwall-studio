import { useGradientCanvas } from "@/lib/useGradientCanvas";
import type { Colors4, Style } from "@/lib/palettes";

interface Props {
  variant: "lock" | "home";
  colors: Colors4;
  style: Style;
  blur: number;
  seed: number;
  grain: number; // 0-100 — display overlay opacity
}

/**
 * A stylized iPhone frame rendering the current wallpaper behind UI chrome.
 *
 * Two variants:
 *  - "lock"  — large clock centered near the top with date above
 *  - "home"  — translucent 4×6 app-icon grid
 *
 * Both share: rounded bezel, dynamic-island pill, top status bar.
 * Zero real app icons or Apple marks — only neutral placeholders.
 *
 * The internal canvas renders at ~360×800 (well above display size for any
 * reasonable preview), so the browser downsamples cleanly with AA.
 */
export function IPhoneMockup({ variant, colors, style, blur, seed, grain }: Props) {
  const canvasRef = useGradientCanvas({ w: 360, h: 800, colors, style, blur, seed }, [
    colors,
    style,
    blur,
    seed,
  ]);

  return (
    <div className="relative h-full aspect-[9/19.5] max-h-full max-w-full">
      {/* Outer body / bezel — subtle metallic gradient */}
      <div className="absolute inset-0 rounded-[14%/7.5%] p-[3px] bg-gradient-to-b from-neutral-600 via-neutral-800 to-neutral-950 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        {/* Screen */}
        <div className="relative w-full h-full rounded-[13%/7%] overflow-hidden bg-black">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          {/* Grain overlay (matches the main preview) */}
          <div
            className="absolute inset-0 pointer-events-none wallpaper-grain mix-blend-overlay"
            style={{ opacity: grain / 100 }}
            aria-hidden
          />

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
