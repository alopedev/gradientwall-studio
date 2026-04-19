// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./useUIStore";

const INITIAL = useUIStore.getState();

describe("useUIStore", () => {
  beforeEach(() => useUIStore.setState(INITIAL, true));

  it("starts with activeTab=picker, activePalette=0", () => {
    const s = useUIStore.getState();
    expect(s.activeTab).toBe("picker");
    expect(s.activePalette).toBe(0);
  });

  it("setActiveTab switches between picker and palettes", () => {
    useUIStore.getState().setActiveTab("palettes");
    expect(useUIStore.getState().activeTab).toBe("palettes");
    useUIStore.getState().setActiveTab("picker");
    expect(useUIStore.getState().activeTab).toBe("picker");
  });

  it("_setActivePalette stores the index", () => {
    useUIStore.getState()._setActivePalette(3);
    expect(useUIStore.getState().activePalette).toBe(3);
  });
});
