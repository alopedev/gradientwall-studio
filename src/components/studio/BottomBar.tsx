import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { m } from "motion/react";
import { useConfigStore, save } from "@/store";
import { activeColors } from "@/lib/palettes";
import { downloadWallpaper } from "@/lib/download";
import { EASE } from "@/lib/motion";
import { SeedBadge } from "./SeedBadge";

/**
 * Action bar that lives directly under the Preview canvas — owns the actions
 * that operate on the *current* gradient as a whole: reshuffle (new seed),
 * save to history, and download. The seed itself surfaces as an editable
 * badge on the left so users can paste / type a specific seed and see it
 * apply instantly.
 */
export function BottomBar() {
  const { device, colors, active, style, blur, grain, seed, reshuffle } = useConfigStore(
    useShallow((s) => ({
      device: s.device,
      colors: s.colors,
      active: s.active,
      style: s.style,
      blur: s.blur,
      grain: s.grain,
      seed: s.seed,
      reshuffle: s.reshuffle,
    })),
  );
  const ramp = activeColors(colors, active);

  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "saved">("idle");
  const [spins, setSpins] = useState(0);

  return (
    <div
      className="liquid-subtle rounded-[2px] border border-white/8 mt-3 px-3.5 py-3 flex items-center justify-between gap-3 flex-wrap"
      role="toolbar"
      aria-label="Gradient actions"
    >
      <div className="flex items-center gap-2">
        <SeedBadge />
        <button
          type="button"
          onClick={() => {
            reshuffle();
            setSpins((s) => s + 1);
          }}
          className="inline-flex items-center gap-2 rounded-[2px] border border-white/14 px-3 py-1.5 font-sans text-[11px] tracking-[0.14em] uppercase text-white/75 transition-colors duration-150 hover:border-white/30 hover:text-white"
        >
          <m.span
            aria-hidden
            animate={{ rotate: spins * 360 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="inline-block"
          >
            ↻
          </m.span>
          Reshuffle
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center rounded-[2px] border border-white/14 px-3 py-1.5 font-sans text-[11px] tracking-[0.14em] uppercase text-white/75 transition-colors duration-150 hover:border-white/30 hover:text-white"
        >
          Save
        </button>
        <button
          type="button"
          disabled={downloadStatus === "downloading"}
          onClick={async () => {
            setDownloadStatus("downloading");
            await new Promise((r) => requestAnimationFrame(() => r(null)));
            try {
              await downloadWallpaper({ device, colors: ramp, style, blur, grain, seed });
              setDownloadStatus("saved");
              setTimeout(() => setDownloadStatus("idle"), 1600);
            } catch {
              setDownloadStatus("idle");
            }
          }}
          className="inline-flex items-center gap-2 rounded-[2px] bg-[#f8f8f8] text-[#171717] px-3.5 py-2 font-sans text-[11px] font-medium tracking-[0.14em] uppercase transition-colors duration-150 hover:bg-white disabled:opacity-80 disabled:cursor-wait"
        >
          {downloadStatus === "downloading" ? (
            <>
              <span className="inline-block h-3 w-3 rounded-full border-2 border-[#171717] border-t-transparent animate-spin" />
              Generating
            </>
          ) : downloadStatus === "saved" ? (
            <>✓ Saved</>
          ) : (
            <>↓ Download</>
          )}
        </button>
      </div>
    </div>
  );
}
