import { Pipette } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  bulletPosition,
  lightAngleFromPointer,
  lightHandlePosition,
  offsetFromRectCenter,
  RING_THICKNESS,
  type Slot,
  slotHueFromState,
  WHEEL_SIZE,
  wheelStateFromPointer,
} from "@/lib/colorEditing/wheel-geometry";
import {
  clampLight,
  computeHarmonicColors,
  inferAnchor,
  LIGHT_OFFSETS,
  type WheelState,
} from "@/lib/gradient/harmonic-edit";
import { useConfigStore } from "@/store";
import { ColorBullet } from "./wheel/ColorBullet";
import { ColorDots } from "./wheel/ColorDots";
import { LightHandle } from "./wheel/LightHandle";
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

  const [focalSlot, setFocalSlot] = useState<Slot>(0);
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
    (slot: Slot, clientX: number, clientY: number) => {
      const area = areaRef.current;
      if (!area) return;
      const { x, y } = offsetFromRectCenter(area.getBoundingClientRect(), clientX, clientY);
      const next = wheelStateFromPointer(x, y, slot);
      setWheelState(next);
      const newColors = computeHarmonicColors(next);
      lastEmittedRef.current = newColors.join(",");
      setColors(newColors);
    },
    [setColors],
  );

  // ────────────────────────────────────────────────────────────────────────
  // Drag del handle de luz — desliza por el anillo exterior
  // ────────────────────────────────────────────────────────────────────────

  const wheelRef = useRef<HTMLDivElement>(null);
  const handleLightDrag = useCallback(
    (clientX: number, clientY: number) => {
      const wheelEl = wheelRef.current;
      if (!wheelEl) return;
      const { x, y } = offsetFromRectCenter(wheelEl.getBoundingClientRect(), clientX, clientY);
      setLightAngle(lightAngleFromPointer(x, y));
    },
    [setLightAngle],
  );

  // ────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────

  const lightPos = lightHandlePosition(lightAngle);
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
