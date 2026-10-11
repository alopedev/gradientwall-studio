import { beforeEach, describe, expect, it } from "vitest";
import { fromFavorite } from "@/lib/look";
import { PALETTES } from "@/lib/palettes";
import { applyPalette, loadLook, remixWallpaper, shuffleWallpaper } from "./coordinator";
import { useConfigStore } from "./useConfigStore";
import { useLookHistoryStore } from "./useLookHistoryStore";

const INITIAL = useConfigStore.getState();
const past = () => useLookHistoryStore.getState().past;

describe("coordinator gestures keep the wallpaper they replace", () => {
  beforeEach(() => {
    useConfigStore.setState(INITIAL, true);
    useLookHistoryStore.getState().clear();
  });

  it("shuffleWallpaper changes the seed and leaves the old wallpaper one step back", () => {
    const before = useConfigStore.getState().seed;
    shuffleWallpaper();
    expect(useConfigStore.getState().seed).not.toBe(before);
    expect(past()).toHaveLength(1);
    expect(past()[0].seed).toBe(before);
  });

  it("remixWallpaper keeps the palette and leaves the old wallpaper one step back", () => {
    const { colors, seed } = useConfigStore.getState();
    remixWallpaper();
    expect(useConfigStore.getState().colors).toEqual(colors);
    expect(past()[0].seed).toBe(seed);
  });

  it("applyPalette records only when the index is a real palette", () => {
    applyPalette(999);
    expect(past()).toHaveLength(0);
    applyPalette(2);
    expect(past()).toHaveLength(1);
    expect(useConfigStore.getState().colors).toEqual(PALETTES[2].colors);
  });

  it("loadLook puts a whole look on the stage and leaves the old one one step back", () => {
    const old = useConfigStore.getState().seed;
    const saved = fromFavorite({ ...useConfigStore.getState(), seed: 4242, style: "mesh" });
    loadLook(saved);
    expect(useConfigStore.getState().seed).toBe(4242);
    expect(useConfigStore.getState().style).toBe("mesh");
    expect(past()[0].seed).toBe(old);
  });
});
