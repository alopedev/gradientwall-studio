import { useEffect, useRef, useState } from "react";

interface Props {
  /** Compass degrees: 0 = top, 90 = right. */
  value: number;
  onChange: (deg: number) => void;
  /** Outer diameter in pixels. */
  size?: number;
}

/**
 * Circular dial for the painterly highlight direction. Drag anywhere inside
 * the dial to rotate the pointer; the position of the cursor relative to the
 * dial center is converted to a compass-style angle (0 = north / top).
 *
 * Visually: an outer ring with subtle gradient fill, a hairline tick at 12
 * o'clock, and a thin pointer line from the center rotating to the value.
 * Keyboard nudge is supported via Arrow keys (1° step, 5° with Shift).
 */
export function LightDial({ value, onChange, size = 72 }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);

  const angleFromEvent = (clientX: number, clientY: number): number => {
    const el = ref.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // atan2(dx, -dy) → compass: 0 = top (north), 90 = right (east).
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return Math.round(deg);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => onChange(angleFromEvent(e.clientX, e.clientY));
    const onUp = () => setDragging(false);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const radius = size / 2;
  // Pointer line geometry — from the center, going outward to ~85% of radius.
  const pointerLen = radius * 0.78;

  return (
    <button
      ref={ref}
      type="button"
      role="slider"
      aria-label="Light direction"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={value}
      aria-valuetext={`${value} degrees`}
      onPointerDown={(e) => {
        e.preventDefault();
        setDragging(true);
        onChange(angleFromEvent(e.clientX, e.clientY));
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 5 : 1;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange((value + step) % 360);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange((value - step + 360) % 360);
        }
      }}
      style={{ width: size, height: size }}
      className="relative shrink-0 rounded-full border border-white/14 bg-[radial-gradient(circle_at_30%_30%,#2c2c33_0%,#1a1a1f_60%,#070709_100%)] outline-none transition-shadow duration-150 hover:border-white/30 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] cursor-grab active:cursor-grabbing select-none touch-none"
    >
      {/* 12-o'clock tick — anchors the user's mental model of "0 = top". */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1 h-1 w-px -translate-x-1/2 bg-white/40"
      />
      {/* Pointer — a hairline + a small dot at the tip, rotated by `value`. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 origin-bottom"
        style={{
          height: pointerLen,
          width: 2,
          transform: `translate(-50%, -100%) rotate(${value}deg)`,
          transformOrigin: "50% 100%",
        }}
      >
        <span
          className="absolute inset-x-0 top-0 mx-auto h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.55)]"
          style={{ marginLeft: "auto", marginRight: "auto", transform: "translate(-2px, -3px)" }}
        />
        <span className="absolute left-1/2 top-1.5 h-full w-px -translate-x-1/2 bg-white/65" />
      </span>
      {/* Center hub — visually anchors the rotation pivot. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85"
      />
    </button>
  );
}
