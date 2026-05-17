// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "./useHistoryStore";

describe("useHistoryStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useHistoryStore.setState({ history: [] }); // merge — keep actions
  });

  it("starts with an empty history", () => {
    expect(useHistoryStore.getState().history).toEqual([]);
  });

  it("_setHistory writes and persists to localStorage under gw_history", () => {
    useHistoryStore
      .getState()
      ._setHistory([
        {
          colors: ["#000000", "#111111", "#222222", "#333333"],
          style: "mesh",
          blur: 48,
          grain: 45,
          seed: 1,
        },
      ]);
    expect(useHistoryStore.getState().history).toHaveLength(1);
    const raw = localStorage.getItem("gw_history");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.history).toHaveLength(1);
    expect(parsed.state.history[0].seed).toBe(1);
  });
});
