import { describe, it, expect } from "vitest";
import { computeSpawn, randomRotation, pickPoolIndex } from "./mouseTrail";
import { mulberry32 } from "./gradient";

describe("computeSpawn()", () => {
  it("permite spawn cuando el intervalo mínimo ha pasado", () => {
    expect(computeSpawn({ lastSpawnTs: 0, now: 80, minInterval: 80 })).toBe(true);
    expect(computeSpawn({ lastSpawnTs: 0, now: 100, minInterval: 80 })).toBe(true);
  });

  it("bloquea spawn cuando aún no ha pasado el intervalo", () => {
    expect(computeSpawn({ lastSpawnTs: 0, now: 79, minInterval: 80 })).toBe(false);
    expect(computeSpawn({ lastSpawnTs: 100, now: 150, minInterval: 80 })).toBe(false);
  });
});

describe("randomRotation()", () => {
  it("permanece dentro de [-10, 10]", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const r = randomRotation(rng);
      expect(r).toBeGreaterThanOrEqual(-10);
      expect(r).toBeLessThanOrEqual(10);
    }
  });

  it("es determinista dado un PRNG con semilla fija", () => {
    const r1 = randomRotation(mulberry32(7));
    const r2 = randomRotation(mulberry32(7));
    expect(r1).toBe(r2);
  });
});

describe("pickPoolIndex()", () => {
  it("devuelve un índice entero en [0, size)", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 50; i++) {
      const idx = pickPoolIndex(rng, 10);
      expect(Number.isInteger(idx)).toBe(true);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(10);
    }
  });

  it("devuelve 0 cuando size es 1", () => {
    expect(pickPoolIndex(mulberry32(1), 1)).toBe(0);
  });
});
