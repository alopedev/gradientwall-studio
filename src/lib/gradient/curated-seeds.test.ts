import { describe, expect, it } from "vitest";
import { CURATED_SEEDS, pickCuratedSeed, pickCuratedSeedExcluding } from "./curated-seeds";

describe("CURATED_SEEDS", () => {
  it("contains exactly 80 entries", () => {
    expect(CURATED_SEEDS).toHaveLength(80);
  });

  it("keeps every seed within the 16-bit range [0, 65535]", () => {
    for (const seed of CURATED_SEEDS) {
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffff);
      expect(Number.isInteger(seed)).toBe(true);
    }
  });

  it("contains no duplicates (the deterministic builder spread them evenly)", () => {
    expect(new Set(CURATED_SEEDS).size).toBe(CURATED_SEEDS.length);
  });
});

describe("pickCuratedSeed", () => {
  it("always returns a value from CURATED_SEEDS", () => {
    for (let i = 0; i < 50; i++) {
      const seed = pickCuratedSeed();
      expect(CURATED_SEEDS).toContain(seed);
    }
  });

  it("is deterministic given a fixed PRNG", () => {
    const fixed = () => 0.5;
    expect(pickCuratedSeed(fixed)).toBe(pickCuratedSeed(fixed));
  });

  it("picks the first seed when rng returns 0", () => {
    expect(pickCuratedSeed(() => 0)).toBe(CURATED_SEEDS[0]);
  });

  it("picks the last seed when rng returns 0.9999...", () => {
    expect(pickCuratedSeed(() => 0.9999)).toBe(CURATED_SEEDS[CURATED_SEEDS.length - 1]);
  });
});

describe("pickCuratedSeedExcluding", () => {
  it("never returns the excluded seed", () => {
    const exclude = CURATED_SEEDS[10];
    for (let i = 0; i < 200; i++) {
      expect(pickCuratedSeedExcluding(exclude)).not.toBe(exclude);
    }
  });

  it("still returns a value from CURATED_SEEDS", () => {
    for (let i = 0; i < 50; i++) {
      const seed = pickCuratedSeedExcluding(CURATED_SEEDS[0]);
      expect(CURATED_SEEDS).toContain(seed);
    }
  });

  it("is robust when the rng repeatedly returns the excluded slot", () => {
    // Simula un rng degenerado que siempre apunta al primer slot (excluido).
    // El guard interno debe romper el loop tras N intentos y devolver algo
    // distinto al excluido eligiendo el siguiente disponible.
    const exclude = CURATED_SEEDS[0];
    let calls = 0;
    const sticky = () => {
      calls++;
      // Primeras 10 llamadas devuelven 0 (cae en el excluded);
      // luego devuelve 0.5 (un slot del medio) para salir del loop.
      return calls < 10 ? 0 : 0.5;
    };
    const result = pickCuratedSeedExcluding(exclude, sticky);
    expect(result).not.toBe(exclude);
    expect(CURATED_SEEDS).toContain(result);
  });
});
