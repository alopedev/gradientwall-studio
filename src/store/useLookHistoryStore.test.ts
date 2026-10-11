import { beforeEach, describe, expect, it } from "vitest";
import { PALETTES } from "@/lib/palettes";
import { LOOK_HISTORY_LIMIT, useLookHistoryStore } from "./useLookHistoryStore";
import { useConfigStore } from "./useConfigStore";

const INITIAL = useConfigStore.getState();
const history = () => useLookHistoryStore.getState();
const config = () => useConfigStore.getState();

/** What a gesture does: remember where we are, then change the wallpaper. */
const gesture = (seed: number) => {
  history().record();
  useConfigStore.setState({ seed });
};

describe("look history", () => {
  beforeEach(() => {
    useConfigStore.setState(INITIAL, true);
    useLookHistoryStore.getState().clear();
  });

  it("starts empty: nothing to go back to or forward to", () => {
    expect(history().canBack()).toBe(false);
    expect(history().canForward()).toBe(false);
    expect(history().back()).toBe(false);
    expect(history().forward()).toBe(false);
  });

  it("goes back to the wallpaper from before a gesture, and forward to the one it left", () => {
    useConfigStore.setState({ seed: 1 });
    gesture(2);
    gesture(3);

    expect(history().back()).toBe(true);
    expect(config().seed).toBe(2);
    expect(history().back()).toBe(true);
    expect(config().seed).toBe(1);
    expect(history().canBack()).toBe(false);

    expect(history().forward()).toBe(true);
    expect(config().seed).toBe(2);
    expect(history().forward()).toBe(true);
    expect(config().seed).toBe(3);
    expect(history().canForward()).toBe(false);
  });

  it("restores every field of the look, not only the seed", () => {
    const forest = PALETTES.find((p) => p.name === "Forest")!;
    useConfigStore.setState({
      colors: [...forest.colors],
      style: "aurora",
      grain: 77,
      lightAngle: 12,
    });
    const before = {
      colors: config().colors,
      style: config().style,
      grain: config().grain,
      lightAngle: config().lightAngle,
      active: config().active,
      engine: config().engine,
    };
    history().record();
    useConfigStore.setState({
      colors: [...PALETTES[0].colors],
      style: "mesh",
      grain: 5,
      lightAngle: 200,
      active: [true, false, true, true],
      engine: "v1",
    });

    history().back();
    expect(config()).toMatchObject(before);
  });

  it("keeps what the user tuned before shuffling: Back returns to the adjusted wallpaper", () => {
    useConfigStore.setState({ grain: 80 });
    gesture(9);
    useConfigStore.setState({ grain: 10 });
    history().back();
    expect(config().grain).toBe(80);
  });

  it("a new gesture after going back drops the forward branch", () => {
    gesture(2);
    gesture(3);
    history().back();
    expect(history().canForward()).toBe(true);
    gesture(4);
    expect(history().canForward()).toBe(false);
    history().back();
    expect(config().seed).toBe(2);
  });

  it("does not stack the same wallpaper twice in a row", () => {
    history().record();
    history().record();
    useConfigStore.setState({ seed: 77 });
    history().back();
    expect(history().canBack()).toBe(false);
  });

  it("keeps the last LOOK_HISTORY_LIMIT wallpapers and forgets the oldest", () => {
    for (let i = 1; i <= LOOK_HISTORY_LIMIT + 5; i++) gesture(i);
    let steps = 0;
    while (history().back()) steps++;
    expect(steps).toBe(LOOK_HISTORY_LIMIT);
    // 35 gestures recorded 35 wallpapers (the start, then seeds 1..34): the oldest five
    // (the start and seeds 1..4) fell off, so the farthest we can reach is seed 5.
    expect(config().seed).toBe(5);
  });

  it("does not alias the live colors: editing them later leaves the saved step intact", () => {
    history().record();
    const saved = config().colors[0];
    useConfigStore.getState().setColor(0, "#123456");
    history().back();
    expect(config().colors[0]).toBe(saved);
  });
});
