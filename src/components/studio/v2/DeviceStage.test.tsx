// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useConfigStore } from "@/store";
import { DeviceStage, frameCorners, screenSize } from "./DeviceStage";

const INITIAL = useConfigStore.getState();

describe("DeviceStage", () => {
  beforeEach(() => {
    act(() => useConfigStore.setState(INITIAL, true));
  });

  it("dresses the phone as an iPhone: side buttons, status bar, flashlight and camera", () => {
    act(() => useConfigStore.getState().setDevice("mobile"));
    const { container } = render(<DeviceStage />);
    expect(container.querySelectorAll("[data-part='side-button']").length).toBe(4);
    expect(container.querySelector("[data-part='status-bar']")).not.toBeNull();
    expect(container.querySelectorAll("[data-part='quick-action']").length).toBe(2);
  });

  it("keeps the tablet and the monitor plain", () => {
    for (const device of ["tablet", "desktop"] as const) {
      act(() => useConfigStore.getState().setDevice(device));
      const { container, unmount } = render(<DeviceStage />);
      expect(container.querySelector("[data-part='side-button']")).toBeNull();
      expect(container.querySelector("[data-part='quick-action']")).toBeNull();
      unmount();
    }
  });

  it("rounds the iPhone in proportion to its width, like an iPhone 16 Pro", () => {
    // 62 pt corners on a 402 pt screen: the radius grows with the screen, so a
    // small phone keeps the shape instead of turning into a pill.
    const { width } = screenSize("mobile");
    const corners = frameCorners("mobile");
    expect(corners.screen).toBe(`calc(${width} * 0.154)`);
    // The bezel follows the screen corner, so both curves share a centre.
    expect(corners.frame).toBe(`calc(${width} * 0.154 + 7px)`);
  });

  it("keeps fixed corners on the tablet and the monitor", () => {
    expect(frameCorners("tablet")).toEqual({ frame: "30px", screen: "20px" });
    expect(frameCorners("desktop")).toEqual({ frame: "14px", screen: "7px" });
  });
});
