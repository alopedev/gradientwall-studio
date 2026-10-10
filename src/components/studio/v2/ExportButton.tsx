import { Check, Download } from "lucide-react";
import { m } from "motion/react";
import { useRef, useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { DEVICE_SIZES } from "@/lib/palettes";
import { useConfigStore, useRenderParams } from "@/store";
import { useWallpaperEngine } from "../engine";

type Phase = "idle" | "busy" | "done";

interface Props {
  /** Short messages shown in the dock toast. */
  onMessage: (message: string) => void;
}

/** Download button: the label fills with a gold bar while the file is rendered and encoded. */
export function ExportButton({ onMessage }: Props) {
  const engine = useWallpaperEngine();
  const device = useConfigStore((s) => s.device);
  const params = useRenderParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  const run = async () => {
    if (phase === "busy") return;
    clearTimeout(resetTimer.current);
    setPhase("busy");
    setProgress(0);
    const started = performance.now();
    try {
      const { filename, bytes } = await engine.exportWallpaper(params, device, setProgress);
      const seconds = ((performance.now() - started) / 1000).toFixed(1);
      onMessage(`Saved ${filename} · ${(bytes / 1048576).toFixed(1)} MB · ${seconds} s`);
      setPhase("done");
      resetTimer.current = setTimeout(() => setPhase("idle"), 1800);
    } catch {
      onMessage("Couldn't render that one. Try again.");
      setPhase("idle");
    }
  };

  return (
    <GlassButton
      onClick={run}
      aria-busy={phase === "busy"}
      aria-label={`Download wallpaper, ${DEVICE_SIZES[device].label}`}
      data-tip={DEVICE_SIZES[device].label}
      className="gws-tip relative min-w-[168px] overflow-hidden tabular-nums @max-[760px]:min-w-0"
    >
      {phase === "busy" && (
        <m.span
          aria-hidden
          animate={{ scaleX: progress }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
          style={{ transformOrigin: "left" }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/10 to-gold/35 after:absolute after:inset-y-0 after:right-0 after:w-0.5 after:bg-gold after:shadow-[0_0_12px_var(--color-gold)] after:content-['']"
        />
      )}
      <span className="relative inline-flex items-center gap-2">
        {phase === "idle" && <Download className="size-[18px]" aria-hidden />}
        {phase === "busy" && (
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-gold/25 border-t-gold"
          />
        )}
        {phase === "done" && (
          <Check className="size-[18px] text-good" strokeWidth={2.4} aria-hidden />
        )}
        <span>
          {phase === "idle" && "Download"}
          {phase === "busy" && `Rendering ${Math.round(progress * 100)}%`}
          {phase === "done" && "Saved"}
        </span>
      </span>
    </GlassButton>
  );
}
