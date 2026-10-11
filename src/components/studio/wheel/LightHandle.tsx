import { useDragHandle } from "./useDragHandle";

const LIGHT_HANDLE_SIZE = 18;

interface LightHandleProps {
  /** x, y in pixels relative to the wheel container centre. */
  x: number;
  y: number;
  angleDeg: number;
  onDrag: (clientX: number, clientY: number) => void;
}

/** Golden handle on the outer ring that sets the light direction. */
export function LightHandle({ x, y, angleDeg, onDrag }: LightHandleProps) {
  const { dragging, handlers } = useDragHandle(onDrag);

  return (
    <button
      type="button"
      role="slider"
      aria-label="Light direction"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={angleDeg}
      aria-valuetext={`${angleDeg} degrees`}
      {...handlers}
      className={`absolute z-40 rounded-full border-2 border-white/95 ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        width: LIGHT_HANDLE_SIZE,
        height: LIGHT_HANDLE_SIZE,
        left: `calc(50% + ${x}px - ${LIGHT_HANDLE_SIZE / 2}px)`,
        top: `calc(50% + ${y}px - ${LIGHT_HANDLE_SIZE / 2}px)`,
        background: "radial-gradient(circle at 35% 35%, #fff 0%, #f0e9c8 60%, #e8c97a 100%)",
        boxShadow: "0 0 14px rgba(255, 220, 130, 0.5), 0 2px 6px rgba(0,0,0,0.4)",
        touchAction: "none",
      }}
    />
  );
}
