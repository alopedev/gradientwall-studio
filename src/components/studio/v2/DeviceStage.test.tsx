// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useConfigStore } from "@/store";
import { DeviceStage } from "./DeviceStage";

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
});
