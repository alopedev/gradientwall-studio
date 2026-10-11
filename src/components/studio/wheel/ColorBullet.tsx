import type { Slot } from "@/lib/colorEditing/wheel-geometry";
import { useDragHandle } from "./useDragHandle";

const FOCAL_BULLET_SIZE = 48;
const SAT_BULLET_SIZE = 28;

interface ColorBulletProps {
  slot: Slot;
  color: string;
  isActive: boolean;
  isFocal: boolean;
  /** Centre in pixels relative to the wheel container. */
  centerX: number;
  centerY: number;
  onDrag: (clientX: number, clientY: number) => void;
}

/** One of the four colour slots on the wheel. Dragging it promotes it to focal. */
export function ColorBullet({
  slot,
  color,
  isActive,
  isFocal,
  centerX,
  centerY,
  onDrag,
}: ColorBulletProps) {
  const size = isFocal ? FOCAL_BULLET_SIZE : SAT_BULLET_SIZE;
  const { dragging, handlers } = useDragHandle(onDrag, {
    dragOnStart: true,
    stopPropagation: true,
  });

  return (
    <button
      type="button"
      aria-label={`Slot ${slot + 1} color${isFocal ? " (focal)" : ""}`}
      {...handlers}
      className={`absolute rounded-full transition-transform duration-150 ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      } ${isFocal ? "z-30" : "z-20"} ${isActive ? "" : "opacity-40"}`}
      style={{
        width: size,
        height: size,
        left: centerX - size / 2,
        top: centerY - size / 2,
        background: color,
        border: `${isFocal ? 3 : 2}px solid rgba(255,255,255,${isFocal ? 0.95 : 0.85})`,
        boxShadow: `0 ${isFocal ? 6 : 4}px ${isFocal ? 16 : 10}px rgba(0,0,0,${isFocal ? 0.5 : 0.45})`,
        touchAction: "none",
      }}
    />
  );
}
