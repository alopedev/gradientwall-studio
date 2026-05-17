import { describe, expect, it } from "vitest";
import { hexToHsl } from "./spec";
import {
  HARMONY_SCHEMES,
  LIGHT_MAX,
  LIGHT_MIN,
  MIN_HUE_DISTANCE,
  SAT_MAX,
  SAT_MIN,
  hueDistance,
  pickHarmonyScheme,
  randomHarmonicColors,
} from "./palette-constraints";

describe("hueDistance", () => {
  it("returns 0 for equal hues", () => {
    expect(hueDistance(120, 120)).toBe(0);
  });

  it("returns the linear distance for non-wrapping pairs", () => {
    expect(hueDistance(100, 130)).toBe(30);
  });

  it("respects the wrap at 360°", () => {
    expect(hueDistance(350, 10)).toBe(20);
    expect(hueDistance(10, 350)).toBe(20);
  });

  it("never exceeds 180°", () => {
    for (let a = 0; a < 360; a += 17) {
      for (let b = 0; b < 360; b += 23) {
        expect(hueDistance(a, b)).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe("pickHarmonyScheme", () => {
  it("returns one of HARMONY_SCHEMES", () => {
    for (let i = 0; i < 50; i++) {
      expect(HARMONY_SCHEMES).toContain(pickHarmonyScheme());
    }
  });

  it("is deterministic given a fixed rng", () => {
    expect(pickHarmonyScheme(() => 0)).toBe("analogous");
    expect(pickHarmonyScheme(() => 0.5)).toBe("complementary");
    expect(pickHarmonyScheme(() => 0.75)).toBe("triadic");
    expect(pickHarmonyScheme(() => 0.9)).toBe("split-comp");
  });
});

describe("randomHarmonicColors — constraints sobre muestras grandes", () => {
  const SAMPLE_SIZE = 1000;

  it("always returns 4 colors as hex #rrggbb", () => {
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const palette = randomHarmonicColors();
      expect(palette).toHaveLength(4);
      for (const hex of palette) {
        expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it(`keeps every slot within saturation [${SAT_MIN}, ${SAT_MAX}] over ${SAMPLE_SIZE} samples`, () => {
    let violations = 0;
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const palette = randomHarmonicColors();
      for (const hex of palette) {
        const [, s] = hexToHsl(hex);
        // Tolerancia 2 puntos: el round-trip hex→hsl pierde precisión.
        if (s < SAT_MIN - 2 || s > SAT_MAX + 2) violations++;
      }
    }
    expect(violations).toBe(0);
  });

  it(`keeps every slot within lightness [${LIGHT_MIN}, ${LIGHT_MAX}] over ${SAMPLE_SIZE} samples`, () => {
    let violations = 0;
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const palette = randomHarmonicColors();
      for (const hex of palette) {
        const [, , l] = hexToHsl(hex);
        if (l < LIGHT_MIN - 2 || l > LIGHT_MAX + 2) violations++;
      }
    }
    expect(violations).toBe(0);
  });

  it("preserves the deep → mid → mid → light hierarchy in average lightness", () => {
    // No por palette (puede variar) pero sí en promedio sobre muchas muestras.
    const sums = [0, 0, 0, 0];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const palette = randomHarmonicColors();
      palette.forEach((hex, slot) => {
        const [, , l] = hexToHsl(hex);
        sums[slot] += l;
      });
    }
    const averages = sums.map((s) => s / SAMPLE_SIZE);
    // El slot 0 debe ser más oscuro en promedio que el slot 3.
    expect(averages[0]).toBeLessThan(averages[3]);
    // Y los mids deben caer en medio.
    expect(averages[1]).toBeGreaterThan(averages[0]);
    expect(averages[2]).toBeGreaterThan(averages[0]);
  });

  it("is deterministic given a fixed rng", () => {
    // mulberry32 fijo: dos llamadas con el mismo rng devuelven la misma paleta.
    // Re-creamos el rng en cada caller porque consume estado.
    const seed1 = () => {
      let n = 0;
      return () => {
        n += 1;
        return (n * 0.1234) % 1;
      };
    };
    const palette1 = randomHarmonicColors(seed1());
    const palette2 = randomHarmonicColors(seed1());
    expect(palette1).toEqual(palette2);
  });
});

describe("MIN_HUE_DISTANCE constant", () => {
  it("is exported with the documented value", () => {
    expect(MIN_HUE_DISTANCE).toBe(25);
  });
});
