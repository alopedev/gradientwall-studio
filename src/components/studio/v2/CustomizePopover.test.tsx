// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { STYLES } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { CustomizePopover, CustomizeTriggerButton } from "./CustomizePopover";

const INITIAL = useConfigStore.getState();

describe("CustomizePopover", () => {
  it("renders only the trigger by default; popover content stays mounted on demand", () => {
    render(<CustomizePopover trigger={<CustomizeTriggerButton />} />);
    expect(screen.getByLabelText(/customize style, colors, light and density/i)).toBeTruthy();
    // Antes de abrir, no debería existir el slider de Softness en el DOM.
    expect(screen.queryByLabelText(/softness/i)).toBeNull();
  });

  it("opens the popover on trigger click and exposes Style / Colors / Light / Density / Softness", async () => {
    const user = userEvent.setup();
    render(<CustomizePopover trigger={<CustomizeTriggerButton />} />);
    await user.click(screen.getByLabelText(/customize style, colors, light and density/i));

    // 4 style thumbnails (uno por STYLE)
    for (const s of STYLES) {
      expect(screen.getByLabelText(new RegExp(`switch to ${s} style`, "i"))).toBeTruthy();
    }
    // Light dial
    expect(screen.getByLabelText(/light direction/i)).toBeTruthy();
    // Density + Softness sliders (por aria-label)
    expect(screen.getByLabelText(/^density$/i)).toBeTruthy();
    expect(screen.getByLabelText(/^softness$/i)).toBeTruthy();
  });

  it("does NOT expose contrast / vibrance / grain controls (decisión de simplificación v2)", async () => {
    const user = userEvent.setup();
    render(<CustomizePopover trigger={<CustomizeTriggerButton />} />);
    await user.click(screen.getByLabelText(/customize style, colors, light and density/i));
    expect(screen.queryByLabelText(/contrast/i)).toBeNull();
    expect(screen.queryByLabelText(/vibrance/i)).toBeNull();
    expect(screen.queryByLabelText(/^grain$/i)).toBeNull();
  });

  it("clicking a style thumbnail updates the config store", async () => {
    // Reset to a known starting style.
    act(() => useConfigStore.setState({ ...INITIAL, style: "mesh" }));
    const user = userEvent.setup();
    render(<CustomizePopover trigger={<CustomizeTriggerButton />} />);
    await user.click(screen.getByLabelText(/customize style, colors, light and density/i));
    await user.click(screen.getByLabelText(/switch to aurora style/i));
    expect(useConfigStore.getState().style).toBe("aurora");
  });
});
