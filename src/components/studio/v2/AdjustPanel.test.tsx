// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useConfigStore } from "@/store";
import { AdjustPanel } from "./AdjustPanel";

const INITIAL = useConfigStore.getState();

const names = () => screen.getAllByRole("slider").map((s) => s.getAttribute("aria-label"));

describe("AdjustPanel", () => {
  beforeEach(() => {
    act(() => useConfigStore.setState(INITIAL, true));
  });

  it("offers grain, rotate and the dark / light tone for a v2 wallpaper", () => {
    render(<AdjustPanel id="adjust" />);
    expect(names()).toEqual(["Grain", "Rotate", "Dark / Light"]);
  });

  it("darkens and lightens from the keyboard, and Reset brings the tone back to 0", async () => {
    const user = userEvent.setup();
    render(<AdjustPanel id="adjust" />);
    const tone = screen.getByRole("slider", { name: "Dark / Light" });
    expect(tone).toHaveAttribute("aria-valuetext", "0");
    act(() => tone.focus());
    await user.keyboard("{ArrowLeft}");
    await act(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    expect(useConfigStore.getState().tone).toBe(-1);
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(useConfigStore.getState().tone).toBe(0);
  });

  it("keeps the tone through Remix, like grain", async () => {
    const user = userEvent.setup();
    act(() => useConfigStore.setState({ tone: -40 }));
    render(<AdjustPanel id="adjust" />);
    await user.click(screen.getByRole("button", { name: /remix/i }));
    expect(useConfigStore.getState().tone).toBe(-40);
  });

  it("keeps light for an aurora, which can't turn", () => {
    act(() => useConfigStore.setState({ style: "aurora" }));
    render(<AdjustPanel id="adjust" />);
    expect(names()).toEqual(["Grain", "Light", "Dark / Light"]);
  });

  it("offers the full v1 set for a favorite saved with v1, and Reset applies v1 defaults", async () => {
    const user = userEvent.setup();
    act(() =>
      useConfigStore.setState({
        engine: "v1",
        blur: 90,
        grain: 70,
        lightAngle: 20,
        contrast: 1.3,
        vibrance: 0.7,
      }),
    );
    render(<AdjustPanel id="adjust" />);
    expect(names()).toEqual(["Softness", "Grain", "Light", "Contrast", "Vibrance"]);

    await user.click(screen.getByRole("button", { name: /reset/i }));
    const s = useConfigStore.getState();
    expect(s.engine).toBe("v1");
    expect([s.blur, s.grain, s.lightAngle, s.contrast, s.vibrance]).toEqual([48, 32, 135, 1, 1.05]);
  });

  it("switches back to the v2 sliders once Remix turns the wallpaper into v2", async () => {
    const user = userEvent.setup();
    act(() => useConfigStore.setState({ engine: "v1" }));
    render(<AdjustPanel id="adjust" />);
    expect(screen.getAllByRole("slider")).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: /remix/i }));
    expect(useConfigStore.getState().engine).toBe("v2");
    expect(names()).toEqual(["Grain", "Rotate", "Dark / Light"]);
  });
});
