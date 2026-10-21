// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { engineOf, type Colors4, type GradientConfig } from "@/lib/palettes";
import { FAVORITES_STORAGE_KEY, MAX_FAVORITES, useFavoritesStore } from "./useFavoritesStore";

const baseConfig = (overrides: Partial<GradientConfig> = {}): GradientConfig => ({
  colors: ["#001122", "#334455", "#667788", "#aabbcc"] as Colors4,
  style: "mesh",
  blur: 48,
  grain: 32,
  seed: 1234,
  lightAngle: 135,
  density: 0.5,
  contrast: 1,
  vibrance: 1.05,
  ...overrides,
});

describe("useFavoritesStore — pin / unpin / reorder / clear / FIFO cap", () => {
  beforeEach(() => {
    useFavoritesStore.getState().clear();
  });

  it("starts empty", () => {
    expect(useFavoritesStore.getState().items).toHaveLength(0);
  });

  it("pin prepends new items (most recent first)", () => {
    useFavoritesStore.getState().pin(baseConfig({ seed: 1 }));
    useFavoritesStore.getState().pin(baseConfig({ seed: 2 }));
    const items = useFavoritesStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].config.seed).toBe(2);
    expect(items[1].config.seed).toBe(1);
  });

  it("pin keeps the engine flag; items saved without one read as v1", () => {
    useFavoritesStore.getState().pin(baseConfig({ seed: 1 }));
    useFavoritesStore.getState().pin(baseConfig({ seed: 2, engine: "v2" }));
    const [v2, legacy] = useFavoritesStore.getState().items;
    expect(v2.config.engine).toBe("v2");
    expect(legacy.config.engine).toBeUndefined();
    expect(engineOf(legacy.config)).toBe("v1");
  });

  it("pin assigns a unique id and a createdAt timestamp", () => {
    useFavoritesStore.getState().pin(baseConfig());
    useFavoritesStore.getState().pin(baseConfig());
    const [a, b] = useFavoritesStore.getState().items;
    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
    expect(typeof a.createdAt).toBe("number");
  });

  it("unpin removes by id; unknown id is silently ignored", () => {
    useFavoritesStore.getState().pin(baseConfig({ seed: 7 }));
    const id = useFavoritesStore.getState().items[0].id;
    useFavoritesStore.getState().unpin("does-not-exist");
    expect(useFavoritesStore.getState().items).toHaveLength(1);
    useFavoritesStore.getState().unpin(id);
    expect(useFavoritesStore.getState().items).toHaveLength(0);
  });

  it("reorder applies the given id order; unknown ids are dropped", () => {
    useFavoritesStore.getState().pin(baseConfig({ seed: 1 }));
    useFavoritesStore.getState().pin(baseConfig({ seed: 2 }));
    useFavoritesStore.getState().pin(baseConfig({ seed: 3 }));
    const ids = useFavoritesStore.getState().items.map((it) => it.id);
    // Invierte el orden.
    useFavoritesStore.getState().reorder([...ids].reverse());
    const seeds = useFavoritesStore.getState().items.map((it) => it.config.seed);
    // Antes: [3, 2, 1] (most-recent-first). Después: [1, 2, 3].
    expect(seeds).toEqual([1, 2, 3]);
  });

  it("FIFO cap drops the oldest when exceeding MAX_FAVORITES", () => {
    for (let i = 0; i < MAX_FAVORITES + 5; i++) {
      useFavoritesStore.getState().pin(baseConfig({ seed: i }));
    }
    const items = useFavoritesStore.getState().items;
    expect(items).toHaveLength(MAX_FAVORITES);
    // El más reciente está al principio; el más antiguo que sobrevive es seed=5
    // (seeds 0..4 cayeron al pinear 24+).
    expect(items[0].config.seed).toBe(MAX_FAVORITES + 4);
    expect(items[items.length - 1].config.seed).toBe(5);
  });

  it("clear empties the list", () => {
    useFavoritesStore.getState().pin(baseConfig());
    useFavoritesStore.getState().pin(baseConfig());
    useFavoritesStore.getState().clear();
    expect(useFavoritesStore.getState().items).toHaveLength(0);
  });

  it("persists to localStorage under the documented key", () => {
    useFavoritesStore.getState().pin(baseConfig({ seed: 42 }));
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.items[0].config.seed).toBe(42);
  });

  it("loads saved favorites only when asked (App does it after hydrating the prerendered page)", async () => {
    useFavoritesStore.getState().pin(baseConfig({ seed: 7 }));
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY)!;
    useFavoritesStore.setState({ items: [] });
    localStorage.setItem(FAVORITES_STORAGE_KEY, saved);
    expect(useFavoritesStore.persist.getOptions().skipHydration).toBe(true);
    expect(useFavoritesStore.getState().items).toHaveLength(0);
    await useFavoritesStore.persist.rehydrate();
    expect(useFavoritesStore.getState().items[0].config.seed).toBe(7);
  });
});
