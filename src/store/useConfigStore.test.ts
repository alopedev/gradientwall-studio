// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore } from "./useConfigStore";
import { PALETTES, STYLES } from "@/lib/palettes";

// Snapshot the pristine state so each test starts fresh.
const INITIAL = useConfigStore.getState();

describe("useConfigStore", () => {
  beforeEach(() => useConfigStore.setState(INITIAL, true));

  it("initializes with Dusk palette, mesh style, blur 48, grain 45", () => {
    const s = useConfigStore.getState();
    expect(s.device).toBe("mobile");
    expect(s.colors).toEqual(PALETTES[0].colors);
    expect(s.style).toBe("mesh");
    expect(s.blur).toBe(48);
    expect(s.grain).toBe(45);
  });

  it("setDevice / setStyle / setBlur / setGrain are single-key mutations", () => {
    useConfigStore.getState().setDevice("desktop");
    expect(useConfigStore.getState().device).toBe("desktop");
    useConfigStore.getState().setStyle("blobs");
    expect(useConfigStore.getState().style).toBe("blobs");
    useConfigStore.getState().setBlur(72);
    expect(useConfigStore.getState().blur).toBe(72);
    useConfigStore.getState().setGrain(12);
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
});
