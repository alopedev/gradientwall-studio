import { wrapAngle } from "../color";
import {
  LIGHT_OFFSETS,
  MAX_LIGHT,
  SLOT_MULTIPLIERS,
  slotHues,
  spreadFromRadius,
  type WheelState,
} from "../gradient/harmonic-edit";

/**
 * Geometry of the HarmonicWheel: where colours and the light handle sit, and
 * how a pointer position maps back to a `WheelState` / light angle. Pure (no
 * React, no DOM) so it can be tested without rendering the wheel.
 */

export type Slot = 0 | 1 | 2 | 3;

export const WHEEL_SIZE = 256;
export const RING_THICKNESS = 20;
const WHEEL_AREA_SIZE = WHEEL_SIZE - RING_THICKNESS * 2;
/** Inner margin so the bullets never leave the wheel area. */
const WHEEL_PADDING = 24;
export const RADIUS_MAX = WHEEL_AREA_SIZE / 2 - WHEEL_PADDING;
/** Radius of the circle the light handle slides on: the middle of the ring. */
export const LIGHT_PERIMETER_RADIUS = (WHEEL_SIZE - RING_THICKNESS) / 2;

export interface Offset {
  /** Pixels relative to a centre. */
  x: number;
  y: number;
}

const DEG_PER_RAD = 180 / Math.PI;

/** Position of a bullet (relative to the wheel-area centre) for a hue and lightness. */
export function bulletPosition(hue: number, light: number): Offset {
  const radiusN = Math.max(0, Math.min(1, light / MAX_LIGHT));
  const r = radiusN * RADIUS_MAX;
  const angleRad = (hue * Math.PI) / 180;
  return { x: Math.cos(angleRad) * r, y: Math.sin(angleRad) * r };
}

/**
 * New `WheelState` for a pointer at `(offsetX, offsetY)` from the wheel-area
 * centre, dragging `focalSlot`. Hue comes from atan2, lightness from the
 * normalised radius, spread from the original picker's curve. The anchor is
 * shifted so the focal slot lands exactly under the pointer.
 */
export function wheelStateFromPointer(
  offsetX: number,
  offsetY: number,
  focalSlot: Slot,
): WheelState {
  let r = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  if (r > RADIUS_MAX) r = RADIUS_MAX;
  const angleRad = Math.atan2(offsetY, offsetX);
  const hueFocal = wrapAngle(angleRad * DEG_PER_RAD);
  const lightFocal = MAX_LIGHT * (r / RADIUS_MAX);
  const spread = spreadFromRadius(r / RADIUS_MAX);

  const anchorHue = wrapAngle(hueFocal - SLOT_MULTIPLIERS[focalSlot] * spread * DEG_PER_RAD);
  const anchorLight = lightFocal - LIGHT_OFFSETS[focalSlot];

  return { anchorHue, anchorLight, spread, focalSlot };
}

/** Hue (0..360) of one slot for a `WheelState`. */
export function slotHueFromState(state: WheelState, slot: Slot): number {
  return slotHues(state)[slot];
}

/** Light handle position on the ring for a compass angle (0 = top, 90 = right). */
export function lightHandlePosition(lightAngle: number): Offset {
  const rad = ((lightAngle - 90) * Math.PI) / 180;
  return {
    x: Math.cos(rad) * LIGHT_PERIMETER_RADIUS,
    y: Math.sin(rad) * LIGHT_PERIMETER_RADIUS,
  };
}

/** Compass light angle (integer degrees, 0 = top, 90 = right) for a pointer offset from the wheel centre. */
export function lightAngleFromPointer(dx: number, dy: number): number {
  let deg = Math.atan2(dx, -dy) * DEG_PER_RAD;
  if (deg < 0) deg += 360;
  return Math.round(deg);
}

/** Offset of a client point from the centre of `rect`. */
export function offsetFromRectCenter(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): Offset {
  return {
    x: clientX - (rect.left + rect.width / 2),
    y: clientY - (rect.top + rect.height / 2),
  };
}
