// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore } from "./useConfigStore";
import { ALL_ACTIVE, PALETTES, STYLES } from "@/lib/palettes";

// Snapshot the pristine state so each test starts fresh.
const INITIAL = useConfigStore.getState();

describe("useConfigStore", () => {
  beforeEach(() => useConfigStore.setState(INITIAL, true));

  it("initializes with Dusk palette, mesh style, blur 48, grain 45", () => {
    const s = useConfigStore.getState();
    expect(s.device).toBe("desktop");
    expect(s.colors).toEqual(PALETTES[0].colors);
    expect(s.style).toBe("mesh");
    expect(s.blur).toBe(48);
    expect(s.grain).toBe(45);
  });

  it("setDevice / setStyle / setBlur / setGrain are single-key mutations", async () => {
    useConfigStore.getState().setDevice("desktop");
    expect(useConfigStore.getState().device).toBe("desktop");
    useConfigStore.getState().setStyle("blobs");
    expect(useConfigStore.getState().style).toBe("blobs");
    // setBlur / setGrain go through an rAF batcher (slider drags coalesce
    // into one render per frame); flush before reading.
    useConfigStore.getState().setBlur(72);
    useConfigStore.getState().setGrain(12);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    expect(useConfigStore.getState().blur).toBe(72);
    expect(useConfigStore.getState().grain).toBe(12);
  });

  it("setColor mutates only the target index", () => {
    useConfigStore.getState().setColor(2, "#abcdef");
    const colors = useConfigStore.getState().colors;
    expect(colors[2]).toBe("#abcdef");
    expect(colors[0]).toBe(INITIAL.colors[0]);
    expect(colors[1]).toBe(INITIAL.colors[1]);
    expect(colors[3]).toBe(INITIAL.colors[3]);
  });

  it("reshuffle changes seed (PRNG) without touching colors/style", () => {
    const before = useConfigStore.getState();
    useConfigStore.getState().reshuffle();
    const after = useConfigStore.getState();
    expect(after.seed).not.toBe(before.seed);
    expect(after.colors).toBe(before.colors);
    expect(after.style).toBe(before.style);
  });

  it("randomize changes colors + style + seed in a single set (one notification)", () => {
    let notifications = 0;
    const unsub = useConfigStore.subscribe(() => notifications++);
    useConfigStore.getState().randomize();
    unsub();
    expect(notifications).toBe(1);

    const s = useConfigStore.getState();
    expect(STYLES).toContain(s.style);
    expect(s.colors).toHaveLength(4);
    s.colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
  });

  describe("active mask", () => {
    it("initializes with all four slots active", () => {
      expect(useConfigStore.getState().active).toEqual(ALL_ACTIVE);
    });

    it("toggleColor flips a single slot when four are active", () => {
      useConfigStore.getState().toggleColor(1);
      expect(useConfigStore.getState().active).toEqual([true, false, true, true]);
    });

    it("toggleColor re-enables an inactive slot", () => {
      useConfigStore.setState({ active: [true, false, true, true] });
      useConfigStore.getState().toggleColor(1);
      expect(useConfigStore.getState().active).toEqual([true, true, true, true]);
    });

    it("refuses to drop below two active slots (silent no-op)", () => {
      // Arrange: only slots 0 and 2 are active — a third toggle-off would leave only one.
      useConfigStore.setState({ active: [true, false, true, false] });
      useConfigStore.getState().toggleColor(0);
      expect(useConfigStore.getState().active).toEqual([true, false, true, false]);
    });

    it("setColors resets the active mask to ALL_ACTIVE", () => {
      useConfigStore.setState({ active: [true, false, true, false] });
      useConfigStore.getState().setColors(["#000000", "#111111", "#222222", "#333333"]);
      expect(useConfigStore.getState().active).toEqual(ALL_ACTIVE);
    });

    it("randomize resets the active mask to ALL_ACTIVE", () => {
      useConfigStore.setState({ active: [false, true, false, true] });
      useConfigStore.getState().randomize();
      expect(useConfigStore.getState().active).toEqual(ALL_ACTIVE);
    });
  });
});
