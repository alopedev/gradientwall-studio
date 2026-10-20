import { Check, Download } from "lucide-react";
import { m } from "motion/react";
import { useRef, useState } from "react";
import { InkButton } from "@/components/ui/InkButton";
import { DEVICE_SIZES } from "@/lib/palettes";
import { useConfigStore, useRenderParams } from "@/store";
import { useWallpaperEngine } from "../engine";
import { DownloadHelp } from "./DownloadHelp";
import type { ToastAction } from "./toast";

const HELP_SEEN_KEY = "gw:download-help";

/** The download help opens once per visit; storage can be off, then it opens every time. */
function helpSeen(): boolean {
  try {
    return sessionStorage.getItem(HELP_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markHelpSeen(): void {
  try {
    sessionStorage.setItem(HELP_SEEN_KEY, "1");
  } catch {
    // Private mode or blocked storage: nothing to remember.
  }
}

type Phase = "idle" | "busy" | "done";

interface Props {
  /** Short messages shown in the dock toast, with an optional link. */
  onMessage: (message: string, action?: ToastAction) => void;
  /** Gold, as the main action of the panel. */
  primary?: boolean;
  className?: string;
}

/** Download button: the label fills with a ink bar while the file is rendered and encoded. */
export function ExportButton({ onMessage, primary = false, className = "" }: Props) {
  const engine = useWallpaperEngine();
  const device = useConfigStore((s) => s.device);
  const params = useRenderParams();
  const sizeLabel = DEVICE_SIZES[device].label;
  const format = engine.exportFormat();
  const spec = `${sizeLabel}, ${format}`;
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  const [help, setHelp] = useState<{ filename: string; bytes: number } | null>(null);

  const run = async () => {
    if (phase === "busy") return;
    clearTimeout(resetTimer.current);
    setPhase("busy");
    setProgress(0);
    try {
      const { filename, bytes } = await engine.exportWallpaper(params, device, setProgress);
      if (!helpSeen()) {
        markHelpSeen();
        setHelp({ filename, bytes });
      } else
        onMessage(
          `Downloaded ${filename} (${(bytes / 1048576).toFixed(1)} MB). Look in your Downloads.`,
          {
            label: "Want more? Browse the packs",
            href: "#packs",
          },
        );
      setPhase("done");
      resetTimer.current = setTimeout(() => setPhase("idle"), 1800);
    } catch {
      onMessage("Couldn't render that one. Try again.");
      setPhase("idle");
    }
  };

  return (
    <>
      <InkButton
        onClick={run}
        aria-busy={phase === "busy"}
        variant={primary ? "primary" : "ghost"}
        aria-label={`Download wallpaper, ${spec}`}
        className={`relative min-w-[176px] overflow-hidden tabular-nums @max-[760px]:min-w-0 ${className}`}
      >
        {phase === "busy" && (
          <m.span
            aria-hidden
            animate={{ scaleX: progress }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
            style={{ transformOrigin: "left" }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/35 after:absolute after:inset-y-0 after:right-0 after:w-0.5 after:bg-primary after:content-['']"
          />
        )}
        <span className="relative inline-flex items-center gap-2">
          {phase === "idle" && <Download className="size-[18px]" aria-hidden />}
          {phase === "busy" && (
            <span
              aria-hidden
              className="size-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
            />
          )}
          {phase === "done" && (
            <Check className="size-[18px] text-good" strokeWidth={2.4} aria-hidden />
          )}
          <span className="grid text-left leading-tight">
            <span>
              {phase === "idle" && "Download"}
              {phase === "busy" && `Rendering ${Math.round(progress * 100)}%`}
              {phase === "done" && "Downloaded"}
            </span>
            <span className="text-[0.64rem] font-normal tracking-[0.04em] opacity-65">
              {`${sizeLabel} · ${format}`}
            </span>
          </span>
        </span>
      </InkButton>
      {help && (
        <DownloadHelp
          device={device}
          filename={help.filename}
          bytes={help.bytes}
          onClose={() => setHelp(null)}
        />
      )}
    </>
  );
}
