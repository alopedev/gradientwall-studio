// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLanding, landingPath } from "@/lib/seo/landings";
import { FAVORITES_STORAGE_KEY, useFavoritesStore } from "./useFavoritesStore";
import { useConfigStore } from "./useConfigStore";
import { useMotionStore } from "./useMotionStore";
import { loadSavedPrefs, startLookFor } from "./page-start";

const INITIAL = useConfigStore.getState();

describe("startLookFor", () => {
  beforeEach(() => useConfigStore.setState(INITIAL, true));

  it("starts a landing on its own look, with or without the trailing slash", () => {
    const aurora = getLanding("aurora-gradient-wallpapers")!;
    startLookFor(landingPath(aurora.slug));
    expect(useConfigStore.getState().style).toBe("aurora");
    useConfigStore.setState(INITIAL, true);
    startLookFor("/4k-gradient-wallpapers");
    expect(useConfigStore.getState().device).toBe("desktop");
    startLookFor("/grainy-gradient-wallpapers/");
    expect(useConfigStore.getState().grain).toBe(85);
  });

  it("leaves other pages on the default look", () => {
    startLookFor("/packs/impasto/");
    expect(useConfigStore.getState().style).toBe(INITIAL.style);
    expect(useConfigStore.getState().device).toBe(INITIAL.device);
  });
});

describe("loadSavedPrefs", () => {
  beforeEach(() => {
    // Setting a persisted store writes it, so clear storage last.
    useFavoritesStore.setState({ items: [] });
    useMotionStore.setState({ paused: false });
    localStorage.clear();
  });

  it("touches no store when nothing is saved (no update reaches the hydrating page)", () => {
    const spy = vi.spyOn(useFavoritesStore.persist, "rehydrate");
    const spyMotion = vi.spyOn(useMotionStore.persist, "rehydrate");
    loadSavedPrefs((cb) => cb());
    expect(spy).not.toHaveBeenCalled();
    expect(spyMotion).not.toHaveBeenCalled();
    spy.mockRestore();
    spyMotion.mockRestore();
  });

  it("loads what was saved, when `later` says so", async () => {
    localStorage.setItem("gw:motion:v1", JSON.stringify({ state: { paused: true }, version: 0 }));
    let run: () => void = () => {};
    loadSavedPrefs((cb) => {
      run = cb;
    });
    expect(useMotionStore.getState().paused).toBe(false);
    run();
    await Promise.resolve();
    expect(useMotionStore.getState().paused).toBe(true);
    expect(localStorage.getItem(FAVORITES_STORAGE_KEY)).toBeNull();
  });
});
