import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { m } from "motion/react";
import { forwardRef } from "react";
import { InkButton } from "@/components/ui/InkButton";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";

interface Props {
  /** How many shuffles so far: the icon turns half a turn per shuffle. */
  spins: number;
  /** The shuffle button was pressed; the caller shuffles (and may start a reveal from it). */
  onShuffle: (button: HTMLButtonElement) => void;
  /** An arrow is about to move through the history; the Studio starts its reveal from it. */
  onStep?: (button: HTMLButtonElement) => void;
  /** Layout of the three buttons. */
  className?: string;
  /** Extra classes for the shuffle button (the Studio's first-visit nudge). */
  shuffleClassName?: string;
  /** Keyboard shortcut announced on the shuffle button, where one exists. */
  shortcut?: string;
  /** Show "Previous" / "Next" tooltips on the arrows. */
  tips?: boolean;
}

const ARROW = "aria-disabled:pointer-events-none aria-disabled:opacity-40";

/**
 * ‹ Shuffle ›: back through the wallpapers left behind, a new one, and forward
 * again. The hero and the Studio panel share it, so both behave the same.
 * The ref reaches the shuffle button (the Studio's Space key reveals from it).
 */
export const ShuffleToolbar = forwardRef<HTMLButtonElement, Props>(function ShuffleToolbar(
  { spins, onShuffle, onStep, className, shuffleClassName, shortcut, tips = false },
  shuffleRef,
) {
  const canBack = useLookHistoryStore((s) => s.past.length > 0);
  const canForward = useLookHistoryStore((s) => s.future.length > 0);

  // aria-disabled (not `disabled`) keeps focus on the arrow when its end of the list is reached.
  const step = (e: React.MouseEvent<HTMLButtonElement>, dir: "back" | "forward") => {
    if (e.currentTarget.getAttribute("aria-disabled") === "true") return;
    onStep?.(e.currentTarget);
    useLookHistoryStore.getState()[dir]();
  };

  return (
    <div role="toolbar" aria-label="Wallpaper controls" className={className}>
      <InkButton
        variant="icon"
        onClick={(e) => step(e, "back")}
        aria-disabled={!canBack}
        aria-label="Previous wallpaper"
        data-tip={tips ? "Previous" : undefined}
        className={tips ? `gws-tip ${ARROW}` : ARROW}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </InkButton>
      <InkButton
        ref={shuffleRef}
        variant="round"
        onClick={(e) => onShuffle(e.currentTarget)}
        aria-keyshortcuts={shortcut}
        aria-label="Shuffle: generate another wallpaper"
        className={shuffleClassName}
      >
        <m.span
          aria-hidden
          animate={{ rotate: spins * 180 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="inline-flex"
        >
          <Shuffle className="size-6" strokeWidth={2.1} />
        </m.span>
      </InkButton>
      <InkButton
        variant="icon"
        onClick={(e) => step(e, "forward")}
        aria-disabled={!canForward}
        aria-label="Next wallpaper"
        data-tip={tips ? "Next" : undefined}
        className={tips ? `gws-tip ${ARROW}` : ARROW}
      >
        <ChevronRight className="size-5" aria-hidden />
      </InkButton>
    </div>
  );
});
