import { Pipette } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampLight,
  computeHarmonicColors,
  inferAnchor,
  LIGHT_OFFSETS,
  MAX_LIGHT,
  spreadFromRadius,
  type WheelState,
} from "@/lib/gradient/harmonic-edit";
import type { ActiveMask, Colors4 } from "@/lib/palettes";
import { MIN_ACTIVE_COLORS } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useColorEditing } from "./useColorEditing";

/**
 * HarmonicWheel — instrumento de colores + luz del Studio v2.
 *
 * Adaptación al theme dark del Studio del Arc-like Color Picker
 * (clementjanssens / retalkbot @ 21st.dev) + ColorPaletteCard-style dots
 * (ravikatiyar @ 21st.dev). El wheel area es CIRCULAR (el componente original
 * acepta cualquier forma pero el círculo encaja mejor con el anillo perimetral
 * de luz). 4 bullets (1 focal + 3 satélites) representan los 4 slots de color,
 * conectados por el modelo armónico de `harmonic-edit.ts`: arrastrar el focal
 * mueve los 4 manteniendo coherencia cromática. Un anillo concéntrico
 * exterior con handle dorado controla `lightAngle` (dirección de la luz)
 * deslizándose por el perímetro circular.
 *
 * Source of truth: el WheelState (anchor + spread + focalSlot) se mantiene
 * local. Cuando el store cambia colors POR FUERA (palette card, UseMyPhoto,
 * surprise), un effect re-infiere el WheelState. Cuando lo cambiamos NOSOTROS
 * por drag, marcamos lastEmittedColorsRef para evitar la oscilación.
 */

// ──────────────────────────────────────────────────────────────────────────
// Geometría del componente
// ──────────────────────────────────────────────────────────────────────────

const WHEEL_SIZE = 256;
const RING_THICKNESS = 20;
const WHEEL_AREA_SIZE = WHEEL_SIZE - RING_THICKNESS * 2;
const WHEEL_PADDING = 24; // margen interior para que los bullets no se salgan
const RADIUS_MAX = WHEEL_AREA_SIZE / 2 - WHEEL_PADDING;
const FOCAL_BULLET_SIZE = 48;
const SAT_BULLET_SIZE = 28;
const LIGHT_HANDLE_SIZE = 18;
// Radio del círculo por el que se desliza el handle de luz — centro del anillo.
const LIGHT_PERIMETER_RADIUS = (WHEEL_SIZE - RING_THICKNESS) / 2;

// ──────────────────────────────────────────────────────────────────────────
// Helpers de geometría
// ──────────────────────────────────────────────────────────────────────────

interface BulletPos {
  /** x, y en pixels relativos al centro del wheel area. */
  x: number;
  y: number;
}

function bulletPosition(hue: number, light: number): BulletPos {
  const radiusN = Math.max(0, Math.min(1, light / MAX_LIGHT));
  const r = radiusN * RADIUS_MAX;
  const angleRad = (hue * Math.PI) / 180;
  return { x: Math.cos(angleRad) * r, y: Math.sin(angleRad) * r };
}

/**
 * Dada la posición del cursor (relativa al centro del wheel area) y el slot
 * focal actual, deriva el nuevo WheelState. Reproduce la matemática del
 * componente original: hue desde atan2, light desde radio normalizado, spread
 * desde la curva del original. anchorHue/Light se desplazan para que el slot
 * focal acabe en la posición exacta del cursor.
 */
function wheelStateFromPointer(
  offsetX: number,
  offsetY: number,
  focalSlot: 0 | 1 | 2 | 3,
): WheelState {
  let r = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  if (r > RADIUS_MAX) r = RADIUS_MAX;
  const angleRad = Math.atan2(offsetY, offsetX);
  const hueFocal = ((angleRad * 180) / Math.PI + 360) % 360;
  const lightFocal = MAX_LIGHT * (r / RADIUS_MAX);
  const normalizedRadius = r / RADIUS_MAX;
  const spread = spreadFromRadius(normalizedRadius);

  const slotMultipliers = [-1.5, -0.5, 0.5, 1.5] as const;
  const anchorHue = (hueFocal - slotMultipliers[focalSlot] * spread * (180 / Math.PI) + 360) % 360;
  const anchorLight = lightFocal - LIGHT_OFFSETS[focalSlot];

  return { anchorHue, anchorLight, spread, focalSlot };
}

// ──────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────

export function HarmonicWheel() {
  const colors = useConfigStore((s) => s.colors);
  const active = useConfigStore((s) => s.active);
  const lightAngle = useConfigStore((s) => s.lightAngle);
  const setColors = useConfigStore((s) => s.setColors);
  const setColor = useConfigStore((s) => s.setColor);
  const setLightAngle = useConfigStore((s) => s.setLightAngle);
  const toggleColor = useConfigStore((s) => s.toggleColor);

  const [focalSlot, setFocalSlot] = useState<0 | 1 | 2 | 3>(0);
  const [wheelState, setWheelState] = useState<WheelState>(() => ({
    ...inferAnchor(colors),
    focalSlot: 0,
  }));

  // Guard anti-oscilación: cuando emitimos colors via drag, marcamos la firma
  // exacta para que el effect de sync externa no re-infiera y mueva los bullets.
  const lastEmittedRef = useRef<string>(colors.join(","));

  useEffect(() => {
    const key = colors.join(",");
    if (key === lastEmittedRef.current) return;
    const inferred = inferAnchor(colors);
    setWheelState({ ...inferred, focalSlot });
    lastEmittedRef.current = key;
  }, [colors, focalSlot]);

  // Reusamos useColorEditing solo para el subset eyedropper. El primer arg es
  // el color actual del focal; el callback fija ese slot.
  const colorEditing = useColorEditing(colors[focalSlot], (hex) => {
    setColor(focalSlot, hex);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Drag de bullets — focal y satélites (drag promociona a focal)
  // ────────────────────────────────────────────────────────────────────────

  const areaRef = useRef<HTMLDivElement>(null);

  const handleBulletDrag = useCallback(
    (slot: 0 | 1 | 2 | 3, clientX: number, clientY: number) => {
      const area = areaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const offsetX = clientX - cx;
      const offsetY = clientY - cy;
      const next = wheelStateFromPointer(offsetX, offsetY, slot);
      setWheelState(next);
      const newColors = computeHarmonicColors(next);
      lastEmittedRef.current = newColors.join(",");
      setColors(newColors);
    },
    [setColors],
  );

  // ────────────────────────────────────────────────────────────────────────
  // Drag del handle de luz — desliza por perímetro cuadrado
  // ────────────────────────────────────────────────────────────────────────

  const wheelRef = useRef<HTMLDivElement>(null);
  const handleLightDrag = useCallback(
    (clientX: number, clientY: number) => {
      const wheelEl = wheelRef.current;
      if (!wheelEl) return;
      const rect = wheelEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      // Convertir a compass: 0=top, 90=right
      let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      setLightAngle(Math.round(deg));
    },
    [setLightAngle],
  );

  // ────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────

  // Handle de luz: posición circular sobre el anillo perimetral.
  // Convención compass (0 = top, 90 = right) → matemática (0 = right, 90 = bottom).
  const lightRad = ((lightAngle - 90) * Math.PI) / 180;
  const lightPos = {
    x: Math.cos(lightRad) * LIGHT_PERIMETER_RADIUS,
    y: Math.sin(lightRad) * LIGHT_PERIMETER_RADIUS,
  };
  const activeCount = active.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Wheel container — cuadrado con anillo perimetral */}
      <div className="flex justify-center">
        <div
          ref={wheelRef}
          className="relative select-none"
          style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
        >
          {/* Anillo perimetral circular: conic gradient enmascarado a una
              corona (radial mask: transparente dentro del wheel area, opaco
              entre wheel area y el borde, transparente fuera). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from -90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.14) 25%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.14) 75%, rgba(255,255,255,0.05) 100%)",
              WebkitMask: `radial-gradient(circle, transparent calc(50% - ${RING_THICKNESS}px), black calc(50% - ${RING_THICKNESS}px + 1px), black 50%, transparent 50%)`,
              mask: `radial-gradient(circle, transparent calc(50% - ${RING_THICKNESS}px), black calc(50% - ${RING_THICKNESS}px + 1px), black 50%, transparent 50%)`,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 22px rgba(255,255,255,0.03)",
            }}
          />

          {/* Tick 12 o'clock — anclaje del "norte" de la luz */}
          <span
            aria-hidden
            className="absolute left-1/2 top-1 h-1.5 w-px -translate-x-1/2 bg-white/55"
          />

          {/* Handle dorado de luz */}
          <LightHandle
            x={lightPos.x}
            y={lightPos.y}
            angleDeg={lightAngle}
            onDrag={handleLightDrag}
          />

          {/* Wheel area — círculo con pattern dotted claro invertido. Es
              decoración; los bullets-button llevan los aria-label accionables. */}
          <div
            ref={areaRef}
            aria-hidden
            className="absolute rounded-full"
            style={{
              top: RING_THICKNESS,
              left: RING_THICKNESS,
              right: RING_THICKNESS,
              bottom: RING_THICKNESS,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.10) 0.8px, transparent 1.2px) 0 0 / 11px 11px, rgba(255,255,255,0.025)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 24px rgba(0,0,0,0.4)",
            }}
          />

          {/* 4 bullets sobre el wheel area. El focal se renderiza último para
              que quede encima de los satélites. */}
          {([0, 1, 2, 3] as const).map((slot) => {
            const hue = slotHueFromState(wheelState, slot);
            const light = clampLight(wheelState.anchorLight + LIGHT_OFFSETS[slot]);
            const pos = bulletPosition(hue, light);
            const isFocal = slot === focalSlot;
            return (
              <ColorBullet
                key={slot}
                slot={slot}
                color={colors[slot]}
                isActive={active[slot]}
                isFocal={isFocal}
                centerX={WHEEL_SIZE / 2 + pos.x}
                centerY={WHEEL_SIZE / 2 + pos.y}
                onDrag={(cx, cy) => {
                  if (slot !== focalSlot) setFocalSlot(slot);
                  handleBulletDrag(slot, cx, cy);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Eyedropper button */}
      {colorEditing.canEyedrop && (
        <button
          type="button"
          onClick={() => {
            void colorEditing.openEyedropper();
          }}
          aria-label="Pick a color from anywhere on screen"
          title="Eyedropper — pick a color from anywhere on screen"
          className="focus-ring inline-flex size-7 items-center justify-center self-start rounded-[4px] border border-white/14 text-white/75 transition-colors duration-150 hover:border-white/40 hover:text-white"
        >
          <Pipette className="size-4" aria-hidden />
        </button>
      )}

      {/* ColorSelector dots — 4 círculos clickeables para cambiar focal */}
      <ColorDots
        colors={colors}
        active={active}
        focalSlot={focalSlot}
        activeCount={activeCount}
        onSelectFocal={(slot) => setFocalSlot(slot)}
        onToggleActive={(slot) => toggleColor(slot)}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────────

function slotHueFromState(state: WheelState, slot: 0 | 1 | 2 | 3): number {
  const slotMultipliers = [-1.5, -0.5, 0.5, 1.5] as const;
  const h = state.anchorHue + slotMultipliers[slot] * state.spread * (180 / Math.PI);
  return ((h % 360) + 360) % 360;
}

interface ColorBulletProps {
  slot: 0 | 1 | 2 | 3;
  color: string;
  isActive: boolean;
  isFocal: boolean;
  centerX: number;
  centerY: number;
  onDrag: (clientX: number, clientY: number) => void;
}

function ColorBullet({
  slot,
  color,
  isActive,
  isFocal,
  centerX,
  centerY,
  onDrag,
}: ColorBulletProps) {
  const size = isFocal ? FOCAL_BULLET_SIZE : SAT_BULLET_SIZE;
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // jsdom / older browsers
    }
    onDrag(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    onDrag(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    setDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      aria-label={`Slot ${slot + 1} color${isFocal ? " (focal)" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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

interface LightHandleProps {
  /** x, y en píxels relativos al centro del wheel container. */
  x: number;
  y: number;
  angleDeg: number;
  onDrag: (clientX: number, clientY: number) => void;
}

function LightHandle({ x, y, angleDeg, onDrag }: LightHandleProps) {
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(true);
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // jsdom / older browsers
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    onDrag(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    setDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      role="slider"
      aria-label="Light direction"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={angleDeg}
      aria-valuetext={`${angleDeg} degrees`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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

interface ColorDotsProps {
  colors: Colors4;
  active: ActiveMask;
  focalSlot: number;
  activeCount: number;
  onSelectFocal: (slot: 0 | 1 | 2 | 3) => void;
  onToggleActive: (slot: 0 | 1 | 2 | 3) => void;
}

function ColorDots({
  colors,
  active,
  focalSlot,
  activeCount,
  onSelectFocal,
  onToggleActive,
}: ColorDotsProps) {
  return (
    <div className="flex items-center gap-2.5" role="radiogroup" aria-label="Pick focal color slot">
      {colors.map((c, i) => {
        const slot = i as 0 | 1 | 2 | 3;
        const isFocal = slot === focalSlot;
        const isActive = active[slot];
        const toggleDisabled = isActive && activeCount <= MIN_ACTIVE_COLORS;
        return (
          <div key={slot} className="flex flex-col items-center gap-1">
            <button
              type="button"
              role="radio"
              aria-checked={isFocal}
              aria-label={`Slot ${slot + 1} focal`}
              onClick={() => onSelectFocal(slot)}
              className={`focus-ring size-[22px] rounded-full transition-transform duration-150 hover:scale-110 active:scale-90 ${
                isActive ? "" : "opacity-40"
              }`}
              style={{
                background: c,
                boxShadow: isFocal
                  ? `inset 0 0 0 2px rgba(15,15,18,0.92), 0 0 0 2px rgba(255,255,255,0.85)`
                  : `inset 0 0 0 1px rgba(255,255,255,0.18)`,
              }}
            />
            <button
              type="button"
              onClick={() => onToggleActive(slot)}
              disabled={toggleDisabled}
              aria-label={isActive ? `Disable slot ${slot + 1}` : `Enable slot ${slot + 1}`}
              title={toggleDisabled ? `Minimum ${MIN_ACTIVE_COLORS} colors required` : undefined}
              className="font-sans text-[9px] tracking-[0.12em] uppercase text-white/45 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isActive ? "on" : "off"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
