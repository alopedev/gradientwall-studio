// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { STYLES } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { CustomizePanel, CustomizeTriggerButton } from "./CustomizePanel";

const INITIAL = useConfigStore.getState();

describe("CustomizePanel (inline panel — Fase 3 v2)", () => {
  it("exposes Style picker, Colors, Light, Density and Softness blocks", () => {
    render(<CustomizePanel onClose={() => {}} />);

    // 4 style thumbnails — uno por STYLE.
    for (const s of STYLES) {
      expect(screen.getByLabelText(new RegExp(`switch to ${s} style`, "i"))).toBeTruthy();
    }
    // LightDial + sliders.
    expect(screen.getByLabelText(/light direction/i)).toBeTruthy();
    expect(screen.getByLabelText(/^density$/i)).toBeTruthy();
    expect(screen.getByLabelText(/^softness$/i)).toBeTruthy();
    // Close button.
    expect(screen.getByLabelText(/close customize panel/i)).toBeTruthy();
  });

  it("does NOT expose contrast / vibrance / grain (decisión de simplificación v2)", () => {
    render(<CustomizePanel onClose={() => {}} />);
    expect(screen.queryByLabelText(/contrast/i)).toBeNull();
    expect(screen.queryByLabelText(/vibrance/i)).toBeNull();
    expect(screen.queryByLabelText(/^grain$/i)).toBeNull();
  });

  it("clicking a style thumbnail updates the config store", async () => {
    act(() => useConfigStore.setState({ ...INITIAL, style: "mesh" }));
    const user = userEvent.setup();
    render(<CustomizePanel onClose={() => {}} />);
    await user.click(screen.getByLabelText(/switch to aurora style/i));
    expect(useConfigStore.getState().style).toBe("aurora");
  });

  it("invokes onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CustomizePanel onClose={onClose} />);
    await user.click(screen.getByLabelText(/close customize panel/i));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("CustomizeTriggerButton", () => {
  it("reflects pressed state via aria-pressed", () => {
    const { rerender } = render(<CustomizeTriggerButton pressed={false} />);
    expect(screen.getByLabelText(/customize style/i).getAttribute("aria-pressed")).toBe("false");
    rerender(<CustomizeTriggerButton pressed={true} />);
    expect(screen.getByLabelText(/customize style/i).getAttribute("aria-pressed")).toBe("true");
  });

  it("fires onClick when activated", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<CustomizeTriggerButton onClick={onClick} />);
    await user.click(screen.getByLabelText(/customize style/i));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
