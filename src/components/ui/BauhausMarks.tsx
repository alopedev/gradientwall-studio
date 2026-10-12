import type { CSSProperties } from "react";
import { useConfigStore } from "@/store";

interface Props {
  /** Edge of each shape, in px. */
  size?: number;
  className?: string;
}

/**
 * Circle, square and triangle in the current palette, set above a headline:
 * the Bauhaus primary forms, coloured by whatever wallpaper the visitor is
 * making. Slot 0 is usually the palette's darkest colour, so the marks use the
 * other three. Decorative, so hidden from assistive tech.
 */
export function BauhausMarks({ size = 34, className = "" }: Props) {
  const colors = useConfigStore((s) => s.colors);
  const [, square, circle, triangle] = colors;
  const box = { width: size, height: size };
  return (
    <div
      data-bauhaus-marks
      aria-hidden="true"
      className={`flex items-center gap-[0.3em] ${className}`}
    >
      <span
        data-shape="circle"
        className="block rounded-full bg-[var(--mark)] transition-colors duration-500"
        style={{ ...box, "--mark": circle } as CSSProperties}
      />
      <span
        data-shape="square"
        className="block bg-[var(--mark)] transition-colors duration-500"
        style={{ ...box, "--mark": square } as CSSProperties}
      />
      <span
        data-shape="triangle"
        className="block bg-[var(--mark)] transition-colors duration-500 [clip-path:polygon(50%_0,100%_100%,0_100%)]"
        style={{ ...box, "--mark": triangle } as CSSProperties}
      />
    </div>
  );
}
