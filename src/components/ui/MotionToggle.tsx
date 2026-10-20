import { Pause, Play } from "lucide-react";
import { useMotionStore } from "@/store/useMotionStore";
import { InkButton } from "./InkButton";

/**
 * Pauses or plays the moving wallpaper everywhere on the page. Hidden with
 * reduced motion, where nothing moves by itself.
 */
export function MotionToggle({ className = "" }: { className?: string }) {
  const paused = useMotionStore((s) => s.paused);
  const toggle = useMotionStore((s) => s.togglePaused);
  const label = paused ? "Play motion" : "Pause motion";
  return (
    <InkButton
      variant="icon"
      onClick={toggle}
      aria-label={label}
      data-tip={label}
      className={`gws-tip motion-reduce:hidden ${className}`}
    >
      {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
    </InkButton>
  );
}
