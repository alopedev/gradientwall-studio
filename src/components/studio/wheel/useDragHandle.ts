import { type PointerEvent, useState } from "react";

interface DragHandleOptions {
  /** Also report the pointer position on pointer-down, not only on move. */
  dragOnStart?: boolean;
  /** Stop the pointer-down from bubbling to a parent handler. */
  stopPropagation?: boolean;
}

/**
 * Pointer-capture drag for a round handle: reports the client position while
 * the pointer is down. Shared by the colour bullets and the light handle of the
 * HarmonicWheel. Spread the returned handlers on the button.
 */
export function useDragHandle(
  onDrag: (clientX: number, clientY: number) => void,
  { dragOnStart = false, stopPropagation = false }: DragHandleOptions = {},
) {
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    e.preventDefault();
    if (stopPropagation) e.stopPropagation();
    setDragging(true);
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // jsdom / older browsers
    }
    if (dragOnStart) onDrag(e.clientX, e.clientY);
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    onDrag(e.clientX, e.clientY);
  };
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    setDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  return {
    dragging,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
