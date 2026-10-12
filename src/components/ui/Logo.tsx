import { useId } from "react";
import { useConfigStore } from "@/store/useConfigStore";
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "./wordmark-path";

/** Wordmark height (ascender to descender) relative to the mark, and the gap between them. */
const WORD_HEIGHT = 0.764;
const GAP = 0.205;

interface MarkProps {
  /** Edge of the square, in px. */
  size: number;
  /** One colour: a paper window instead of the palette. */
  ink?: boolean;
  className?: string;
}

/**
 * The brand mark: an ink square with a round window. Through the window you
 * see the wallpaper being made, so the gradient is the Studio's palette.
 * Decorative: the link around it carries the name.
 */
export function BrandMark({ size, ink = false, className = "" }: MarkProps) {
  const colors = useConfigStore((s) => s.colors);
  const id = `brand-window-${useId().replace(/:/g, "")}`;
  return (
    <svg
      data-brand-mark
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`flex-none ${className}`}
    >
      {!ink && (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="16" y1="0" x2="84" y2="0">
            {colors.map((c, i) => (
              <stop
                // biome-ignore lint/suspicious/noArrayIndexKey: four fixed slots
                key={i}
                offset={i / (colors.length - 1)}
                stopColor={c}
                style={{ transition: "stop-color 500ms" }}
              />
            ))}
          </linearGradient>
        </defs>
      )}
      <rect width="100" height="100" rx="10" fill="var(--color-ink)" />
      <circle cx="50" cy="50" r="33.75" fill={ink ? "var(--color-bg)" : `url(#${id})`} />
    </svg>
  );
}

/** Mark and wordmark side by side, the wordmark centred on the mark. */
export function Logo({ size, ink = false, className = "" }: MarkProps) {
  const [, , vw, vh] = WORDMARK_VIEWBOX.split(" ").map(Number);
  const height = size * WORD_HEIGHT;
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: size * GAP }}>
      <BrandMark size={size} ink={ink} />
      <svg
        data-wordmark
        aria-hidden="true"
        height={height}
        width={(height * vw) / vh}
        viewBox={WORDMARK_VIEWBOX}
        className="flex-none"
      >
        <path d={WORDMARK_PATH} fill="var(--color-ink)" />
      </svg>
    </span>
  );
}
