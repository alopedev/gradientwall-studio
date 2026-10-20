import { beforeEach, describe, expect, it } from "vitest";
import { useMotionStore } from "./useMotionStore";

describe("useMotionStore", () => {
  beforeEach(() => useMotionStore.setState({ paused: false }));

  it("starts with motion playing", () => {
    expect(useMotionStore.getState().paused).toBe(false);
  });

  it("toggles pause on and off", () => {
    useMotionStore.getState().togglePaused();
    expect(useMotionStore.getState().paused).toBe(true);
    useMotionStore.getState().togglePaused();
    expect(useMotionStore.getState().paused).toBe(false);
  });

  it("remembers the choice for the next visit", () => {
    useMotionStore.getState().togglePaused();
    expect(localStorage.getItem("gw:motion:v1")).toContain('"paused":true');
  });
});
