import type { Colors4 } from "../palettes";
import { hexToHsl, hslToHex } from "./spec";

/**
 * Capa pura para el HarmonicWheel del Studio v2. Sin React, sin DOM.
 *
 * Reúne tres responsabilidades:
 *  1. Calcular el spread angular según el radio normalizado del bullet focal,
 *     usando la fórmula exacta del componente de inspiración Arc-like Color
 *     Picker (clementjanssens / retalkbot @ 21st.dev).
 *  2. Derivar los 4 colores armónicos a partir de `(anchorHue, anchorLight,
 *     spread, focalSlot)`.
 *  3. Invertir el proceso (`inferAnchor`) para reposicionar el wheel cuando el
 *     usuario aplica una paleta curada, sube una foto o carga un favorito.
 *
 * También expone `anglesToSquarePerimeter` para el handle de luz que se desliza
 * por el perímetro CUADRADO del wheel (no circular).
 */

// ──────────────────────────────────────────────────────────────────────────
// Constantes derivadas del componente original
// ──────────────────────────────────────────────────────────────────────────

/**
 * Spread mínimo y máximo en radianes. ¡Cuidado!: en el original `minSpread > maxSpread`,
 * así que el spread efectivo DECRECE con el radio normalizado (centro = puntos
 * más separados cromáticamente; borde = puntos más juntos).
 */
export const MIN_SPREAD = Math.PI / 1.5;
export const MAX_SPREAD = Math.PI / 3;
export const SPREAD_FACTOR = 0.4;

/** Rango de lightness del componente original. */
export const MIN_LIGHT = 15;
export const MAX_LIGHT = 90;

/**
 * Offsets de lightness por slot, simétricos alrededor del anchor (suman 0).
 * Producen una jerarquía visual deep → mid → mid → light que evita que los
 * 4 colores sean del mismo tono claro/oscuro y aplanen el wallpaper.
 */
export const LIGHT_OFFSETS: readonly [number, number, number, number] = [-15, -5, 5, 15];

/** Saturación fija (decisión de producto cerrada). */
export const FIXED_SATURATION = 100;

// ──────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────

export interface WheelState {
  /** Hue del anchor (0..360). */
  anchorHue: number;
  /** Lightness del anchor (0..100). */
  anchorLight: number;
  /** Spread angular en radianes (sin spreadFactor — ya aplicado). */
  spread: number;
  /** Qué slot es el focal (bullet grande). 0..3. */
  focalSlot: 0 | 1 | 2 | 3;
}

export interface Point2D {
  x: number;
  y: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Spread + lightness helpers
// ──────────────────────────────────────────────────────────────────────────

export function spreadFromRadius(rNormalized: number): number {
  const r = Math.max(0, Math.min(1, rNormalized));
  return (MIN_SPREAD + (MAX_SPREAD - MIN_SPREAD) * r ** 3) * SPREAD_FACTOR;
}

export function clampLight(l: number): number {
  if (l < 10) return 10;
  if (l > 90) return 90;
  return l;
}

// ──────────────────────────────────────────────────────────────────────────
// Slot hues + colores
// ──────────────────────────────────────────────────────────────────────────

const SLOT_MULTIPLIERS: readonly number[] = [-1.5, -0.5, 0.5, 1.5];

/**
 * Devuelve los 4 hues absolutos (0..360) de los 4 slots dado un WheelState.
 * Los slots se distribuyen simétricamente alrededor del anchorHue con
 * espaciado `spread` (radianes), wrap-aware en 360°.
 */
export function slotHues(state: WheelState): [number, number, number, number] {
  const degPerRad = 180 / Math.PI;
  return SLOT_MULTIPLIERS.map((m) => {
    const h = state.anchorHue + m * state.spread * degPerRad;
    return ((h % 360) + 360) % 360;
  }) as [number, number, number, number];
}

/**
 * Calcula los 4 colores hex para un WheelState. Saturation fija a 100%.
 * Lightness por slot: anchorLight + LIGHT_OFFSETS[i] clampado a [10, 90].
 */
export function computeHarmonicColors(state: WheelState): Colors4 {
  const hues = slotHues(state);
  return hues.map((h, i) => {
    const light = clampLight(state.anchorLight + LIGHT_OFFSETS[i]);
    return hslToHex(h, FIXED_SATURATION, light);
  }) as Colors4;
}

// ──────────────────────────────────────────────────────────────────────────
// Inferencia inversa: paleta → WheelState
// ──────────────────────────────────────────────────────────────────────────

/**
 * Dada una paleta arbitraria (curada, extraída de foto, favorito), encuentra
 * el `WheelState` que mejor la represente para reposicionar los bullets en el
 * wheel. Implementación pragmática (no exacta — round-trip no es identity):
 *
 *  - anchorHue = centroide circular de los 4 hues.
 *  - anchorLight = lightness promedio (LIGHT_OFFSETS son simétricos alrededor de 0).
 *  - spread = derivado del "rango angular usado" (360° − maxGap) / 3, clampado
 *    al rango válido [MIN_SPREAD·SPREAD_FACTOR, MAX_SPREAD·SPREAD_FACTOR]
 *    (recordar: maxSpread < minSpread, así que el rango es [MAX·F, MIN·F]).
 *  - focalSlot = 0 por defecto (decisión de producto).
 */
export function inferAnchor(colors: Colors4): WheelState {
  const hsls = colors.map((c) => hexToHsl(c));
  const hues = hsls.map(([h]) => h);
  const lights = hsls.map(([, , l]) => l);

  // Centroide circular: convertir cada hue a un vector unitario y promediar.
  const xs = hues.map((h) => Math.cos((h * Math.PI) / 180));
  const ys = hues.map((h) => Math.sin((h * Math.PI) / 180));
  const meanX = xs.reduce((a, b) => a + b, 0) / 4;
  const meanY = ys.reduce((a, b) => a + b, 0) / 4;
  const anchorHue = ((Math.atan2(meanY, meanX) * 180) / Math.PI + 360) % 360;

  // Rango angular usado = 360 − maxGap entre hues consecutivos (ordenados).
  const sortedHues = [...hues].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < 4; i++) {
    const gap = (sortedHues[(i + 1) % 4] - sortedHues[i] + 360) % 360;
    if (gap > maxGap) maxGap = gap;
  }
  const usedRangeDeg = 360 - maxGap;
  // Los 4 slots cubren un arco de 3·spread radianes (de −1.5s a +1.5s).
  // Por tanto spread = usedRangeDeg/3 convertido a rad.
  let spread = (usedRangeDeg / 3) * (Math.PI / 180);

  // Clamp al rango válido. Recordar: MAX_SPREAD < MIN_SPREAD.
  const spreadMin = MAX_SPREAD * SPREAD_FACTOR;
  const spreadMax = MIN_SPREAD * SPREAD_FACTOR;
  if (spread < spreadMin) spread = spreadMin;
  if (spread > spreadMax) spread = spreadMax;

  // anchorLight = lightness promedio (LIGHT_OFFSETS suman 0 por simetría).
  const anchorLight = lights.reduce((a, b) => a + b, 0) / 4;

  return {
    anchorHue,
    anchorLight,
    spread,
    focalSlot: 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Handle de luz: mapeo compass → posición en perímetro cuadrado
// ──────────────────────────────────────────────────────────────────────────

/**
 * Dado un ángulo `deg` en convención compass (0 = top, 90 = right, sentido
 * horario) y un cuadrado de lado `L` centrado en el origen, devuelve la
 * posición `{x, y}` donde una línea desde el centro en dirección `deg`
 * intersecta el perímetro del cuadrado.
 *
 * El sistema de coordenadas asume que `y` crece hacia abajo (convención
 * pantalla), por eso `top` = `y` negativa.
 *
 * Uso típico: posicionar el handle de luz que se desliza por los bordes del
 * wheel cuadrado. Los 4 puntos cardinales caen en el centro de cada lado;
 * las diagonales caen en las esquinas.
 */
export function anglesToSquarePerimeter(deg: number, L: number): Point2D {
  const normalized = ((deg % 360) + 360) % 360;
  // Compass → matemático: compass=0 (top) ↔ math=90; compass=90 (right) ↔ math=0
  const theta = ((90 - normalized) * Math.PI) / 180;
  const dx = Math.cos(theta);
  const dy = -Math.sin(theta); // y crece hacia abajo
  const half = L / 2;
  // Escalar el vector unitario para que toque el perímetro del cuadrado.
  const scale = half / Math.max(Math.abs(dx), Math.abs(dy));
  return { x: dx * scale, y: dy * scale };
}
