// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomizePanel, CustomizeTriggerButton } from "./CustomizePanel";

describe("CustomizePanel (rediseño v2 — wheel + palettes + sliders)", () => {
  it("exposes Colors + Palettes sections (titles) and Softness + Grain sliders", () => {
    render(<CustomizePanel onClose={() => {}} />);
    // Section labels (uppercase tracking).
    expect(screen.getByText(/^colors$/i)).toBeTruthy();
    expect(screen.getByText(/^palettes$/i)).toBeTruthy();
    // Sliders (aria-label).
    expect(screen.getByLabelText(/^softness$/i)).toBeTruthy();
    expect(screen.getByLabelText(/^grain$/i)).toBeTruthy();
    // Close button.
    expect(screen.getByLabelText(/close customize panel/i)).toBeTruthy();
  });

  it("does NOT expose Style picker / Light direction / Density (eliminados en el rediseño)", () => {
    render(<CustomizePanel onClose={() => {}} />);
    // Style picker antiguo: 4 thumbnails con "switch to … style". Sin ellos.
    expect(screen.queryByLabelText(/switch to .* style/i)).toBeNull();
    // LightDial separado: ya no existe (absorbido por el anillo del wheel).
    // El handle de luz del wheel sí tiene aria-label "Light direction" pero
    // role=slider, así que distinguir es por role+name combinado.
    // Density slider eliminado.
    expect(screen.queryByLabelText(/^density$/i)).toBeNull();
    // Contrast / vibrance siguen sin estar (mantenido de v1).
    expect(screen.queryByLabelText(/contrast/i)).toBeNull();
    expect(screen.queryByLabelText(/vibrance/i)).toBeNull();
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
  // El aria-label se actualizó al rediseño: "Customize colors, light, softness and grain".
  const TRIGGER_LABEL = /customize colors, light, softness/i;

  it("reflects pressed state via aria-pressed", () => {
    const { rerender } = render(<CustomizeTriggerButton pressed={false} />);
    expect(screen.getByLabelText(TRIGGER_LABEL).getAttribute("aria-pressed")).toBe("false");
    rerender(<CustomizeTriggerButton pressed={true} />);
    expect(screen.getByLabelText(TRIGGER_LABEL).getAttribute("aria-pressed")).toBe("true");
  });

  it("fires onClick when activated", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<CustomizeTriggerButton onClick={onClick} />);
    await user.click(screen.getByLabelText(TRIGGER_LABEL));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
