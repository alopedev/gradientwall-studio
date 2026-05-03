import { useEffect, useState } from "react";
import { m } from "motion/react";
import { useConfigStore, useRenderParams, save } from "@/store";
import { downloadWallpaper } from "@/lib/download";
import { EASE } from "@/lib/motion";
import { SeedBadge } from "./SeedBadge";
import { HistoryDrawer } from "./HistoryDrawer";
import { MagneticButton } from "../ui/MagneticButton";

/**
 * Action bar that lives directly under the Preview canvas — owns the actions
 * that operate on the *current* gradient as a whole: surprise-me (full
 * randomize), save to history, and download. The seed itself surfaces as an
 * editable badge so users can paste / type a specific seed and see it apply
 * instantly.
 *
 * Keyboard shortcuts (active when no input is focused):
 *   Space → Surprise me (randomize palette + style + seed + light + density)
 *   R     → Reshuffle (same palette + style, new seed only)
 */
export function BottomBar() {
  const device = useConfigStore((s) => s.device);
  const reshuffle = useConfigStore((s) => s.reshuffle);
  const randomize = useConfigStore((s) => s.randomize);
  const params = useRenderParams();

  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "saved">("idle");
  const [spins, setSpins] = useState(0);

  // Global shortcuts. Bail out when typing inside any input/textarea/contenteditable
  // so SeedBadge edits and ColorHUD hex inputs keep working as expected.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        randomize();
        setSpins((s) => s + 1);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        reshuffle();
        setSpins((s) => s + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [randomize, reshuffle]);

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
            randomize();
            setSpins((s) => s + 1);
          }}
          title="Randomize palette, style and seed (Space)"
          className="tactile inline-flex items-center gap-2 rounded-[2px] px-3 py-1.5 font-sans text-[11px] tracking-[0.14em] uppercase text-white/85 hover:text-white"
        >
          <m.span
            aria-hidden
            animate={{ rotate: spins * 360 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="inline-block"
          >
            ✦
          </m.span>
          Surprise me
          <kbd
            aria-hidden
            className="ml-1 hidden md:inline-flex items-center justify-center min-w-[20px] h-[16px] px-1 rounded-[3px] bg-white/10 border border-white/15 text-[9px] tracking-[0.05em] text-white/65 normal-case"
          >
            Space
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => {
            reshuffle();
            setSpins((s) => s + 1);
          }}
          title="New seed, same palette and style (R)"
          className="hidden md:inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1.5 font-sans text-[10px] tracking-[0.14em] uppercase text-white/55 hover:text-white/85"
        >
          ↻ Reshuffle
          <kbd
            aria-hidden
            className="ml-0.5 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-[3px] bg-white/8 border border-white/12 text-[9px] tracking-[0.05em] text-white/60 normal-case"
          >
            R
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <HistoryDrawer />
        <button
          type="button"
          onClick={save}
          className="tactile inline-flex items-center rounded-[2px] px-3 py-1.5 font-sans text-[11px] tracking-[0.14em] uppercase text-white/85 hover:text-white"
        >
          Save
        </button>
        <MagneticButton>
          <button
            type="button"
            disabled={downloadStatus === "downloading"}
            onClick={async () => {
              setDownloadStatus("downloading");
              await new Promise((r) => requestAnimationFrame(() => r(null)));
              try {
                await downloadWallpaper({ device, ...params });
                setDownloadStatus("saved");
                setTimeout(() => setDownloadStatus("idle"), 1600);
              } catch {
                setDownloadStatus("idle");
              }
            }}
            className="inline-flex items-center gap-2 rounded-[2px] bg-gradient-to-b from-white to-[#e6e6e6] text-[#171717] px-3.5 py-2 font-sans text-[11px] font-medium tracking-[0.14em] uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(0,0,0,0.18),0_1px_0_rgba(255,255,255,0.05),0_4px_10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,0,0,0.4)] transition-[background,transform,opacity] duration-150 hover:from-white hover:to-white active:translate-y-[0.5px] disabled:opacity-80 disabled:cursor-wait focus-ring"
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
        </MagneticButton>
      </div>
    </div>
  );
}
