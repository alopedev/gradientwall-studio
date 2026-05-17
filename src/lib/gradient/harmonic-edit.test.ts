import { describe, expect, it } from "vitest";
import { PALETTES } from "../palettes";
import {
  anglesToSquarePerimeter,
  clampLight,
  computeHarmonicColors,
  inferAnchor,
  LIGHT_OFFSETS,
  MAX_SPREAD,
  MIN_SPREAD,
  slotHues,
  SPREAD_FACTOR,
  spreadFromRadius,
  type WheelState,
} from "./harmonic-edit";

describe("spreadFromRadius — fórmula del componente original", () => {
  it("decrece con el radio (centro = puntos más separados, borde = juntos)", () => {
    // (minSpread + 0) * spreadFactor at r=0; (minSpread + (maxSpread - minSpread)) * spreadFactor at r=1
    // Como minSpread > maxSpread (π/1.5 > π/3), el spread DECRECE con r.
    const sCenter = spreadFromRadius(0);
    const sEdge = spreadFromRadius(1);
    expect(sCenter).toBeGreaterThan(sEdge);
    expect(sCenter).toBeCloseTo(MIN_SPREAD * SPREAD_FACTOR, 5);
    expect(sEdge).toBeCloseTo(MAX_SPREAD * SPREAD_FACTOR, 5);
  });

  it("clampa fuera del rango [0, 1]", () => {
    expect(spreadFromRadius(-0.5)).toBe(spreadFromRadius(0));
    expect(spreadFromRadius(1.5)).toBe(spreadFromRadius(1));
  });

  it("es monotónicamente decreciente", () => {
    let prev = spreadFromRadius(0);
    for (let i = 1; i <= 10; i++) {
      const cur = spreadFromRadius(i / 10);
      expect(cur).toBeLessThanOrEqual(prev);
      prev = cur;
    }
  });
});

describe("clampLight", () => {
  it("clampa al rango [10, 90]", () => {
    expect(clampLight(50)).toBe(50);
    expect(clampLight(5)).toBe(10);
    expect(clampLight(95)).toBe(90);
    expect(clampLight(-100)).toBe(10);
    expect(clampLight(1000)).toBe(90);
  });
});

describe("slotHues — distribución angular de los 4 slots", () => {
  it("centra los 4 hues alrededor del anchorHue con offsets [-1.5, -0.5, +0.5, +1.5] * spread", () => {
    const spread = 0.5; // rad
    const state: WheelState = { anchorHue: 180, anchorLight: 50, spread, focalSlot: 0 };
    const hues = slotHues(state);
    const offsetsRad = [-1.5, -0.5, 0.5, 1.5];
    const offsetsDeg = offsetsRad.map((m) => (m * spread * 180) / Math.PI);
    hues.forEach((h, i) => {
      expect(h).toBeCloseTo((180 + offsetsDeg[i] + 360) % 360, 3);
    });
  });

  it("wrap-around 360°: anchor=10°, spread grande → algunos hues < 0 antes de modular", () => {
    const state: WheelState = { anchorHue: 10, anchorLight: 50, spread: 1, focalSlot: 0 };
    const hues = slotHues(state);
    hues.forEach((h) => {
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    });
  });
});

describe("computeHarmonicColors", () => {
  it("devuelve 4 hex válidos", () => {
    const state: WheelState = { anchorHue: 200, anchorLight: 50, spread: 0.4, focalSlot: 0 };
    const colors = computeHarmonicColors(state);
    expect(colors).toHaveLength(4);
    colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });

  it("aplica LIGHT_OFFSETS por slot (jerarquía deep→light clampada)", () => {
    // Con anchorLight=50, los lights resultantes son [35, 45, 55, 65] (sin clamp).
    const state: WheelState = { anchorHue: 0, anchorLight: 50, spread: 0.3, focalSlot: 0 };
    const colors = computeHarmonicColors(state);
    // Hex → hsl roundtrip mínimo: el orden de lightness es estrictamente creciente
    // (asumiendo que el clamp no se activa para anchorLight=50)
    const lights = colors.map((c) => {
      const r = parseInt(c.slice(1, 3), 16) / 255;
      const g = parseInt(c.slice(3, 5), 16) / 255;
      const b = parseInt(c.slice(5, 7), 16) / 255;
      return ((Math.max(r, g, b) + Math.min(r, g, b)) / 2) * 100;
    });
    for (let i = 1; i < 4; i++) {
      expect(lights[i]).toBeGreaterThan(lights[i - 1]);
    }
  });

  it("respeta el clamp [10, 90] cuando anchorLight es extremo", () => {
    // anchorLight = 5 → lights = [-10, 0, 10, 20] sin clamp; clampados = [10, 10, 10, 20].
    const state: WheelState = { anchorHue: 0, anchorLight: 5, spread: 0.3, focalSlot: 0 };
    const colors = computeHarmonicColors(state);
    // El primer color debe ser muy oscuro (light=10, no negro absoluto)
    expect(colors[0]).not.toBe("#000000");
  });
});

describe("inferAnchor — round-trip aproximado para las 10 PALETTES", () => {
  it("devuelve un WheelState válido para cada paleta curada", () => {
    PALETTES.forEach((p) => {
      const state = inferAnchor(p.colors);
      expect(state.anchorHue).toBeGreaterThanOrEqual(0);
      expect(state.anchorHue).toBeLessThan(360);
      expect(state.anchorLight).toBeGreaterThanOrEqual(0);
      expect(state.anchorLight).toBeLessThanOrEqual(100);
      expect(state.spread).toBeGreaterThan(0);
      expect(state.focalSlot).toBe(0);
    });
  });

  it("verifica que LIGHT_OFFSETS son simétricos alrededor de 0 (suman 0)", () => {
    const sum = LIGHT_OFFSETS.reduce((a, b) => a + b, 0);
    expect(sum).toBe(0);
  });
});

describe("anglesToSquarePerimeter — mapeo compass → posición en perímetro cuadrado", () => {
  // Convención compass: 0=top, 90=right, 180=bottom, 270=left
  // Cuadrado centrado en origen con lado L → vértices en (±L/2, ±L/2)
  const L = 100;
  const half = L / 2;

  it("0° (top) → centro del lado superior", () => {
    const { x, y } = anglesToSquarePerimeter(0, L);
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(-half, 5);
  });

  it("90° (right) → centro del lado derecho", () => {
    const { x, y } = anglesToSquarePerimeter(90, L);
    expect(x).toBeCloseTo(half, 5);
    expect(y).toBeCloseTo(0, 5);
  });

  it("180° (bottom) → centro del lado inferior", () => {
    const { x, y } = anglesToSquarePerimeter(180, L);
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(half, 5);
  });

  it("270° (left) → centro del lado izquierdo", () => {
    const { x, y } = anglesToSquarePerimeter(270, L);
    expect(x).toBeCloseTo(-half, 5);
    expect(y).toBeCloseTo(0, 5);
  });

  it("45° → esquina top-right", () => {
    const { x, y } = anglesToSquarePerimeter(45, L);
    expect(x).toBeCloseTo(half, 5);
    expect(y).toBeCloseTo(-half, 5);
  });

  it("135° → esquina bottom-right", () => {
    const { x, y } = anglesToSquarePerimeter(135, L);
    expect(x).toBeCloseTo(half, 5);
    expect(y).toBeCloseTo(half, 5);
  });

  it("225° → esquina bottom-left", () => {
    const { x, y } = anglesToSquarePerimeter(225, L);
    expect(x).toBeCloseTo(-half, 5);
    expect(y).toBeCloseTo(half, 5);
  });

  it("315° → esquina top-left", () => {
    const { x, y } = anglesToSquarePerimeter(315, L);
    expect(x).toBeCloseTo(-half, 5);
    expect(y).toBeCloseTo(-half, 5);
  });

  it("normaliza ángulos negativos y > 360", () => {
    const a1 = anglesToSquarePerimeter(0, L);
    const a2 = anglesToSquarePerimeter(360, L);
    const a3 = anglesToSquarePerimeter(-360, L);
    expect(a1).toEqual(a2);
    expect(a1).toEqual(a3);
  });
});
