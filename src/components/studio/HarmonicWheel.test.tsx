import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfigStore } from "@/store/useConfigStore";
import { resetStores } from "@/test-utils";
import { HarmonicWheel } from "./HarmonicWheel";

describe("<HarmonicWheel />", () => {
  beforeEach(() => {
    resetStores();
    // Forzar EyeDropper para que el botón aparezca en los tests
    // biome-ignore lint/suspicious/noExplicitAny: test-only window stub
    (window as any).EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: "#abcdef" });
      }
    };
  });

  it("renders 4 color bullets and 4 focal-selector dots", () => {
    useConfigStore.setState({ colors: ["#112233", "#445566", "#778899", "#aabbcc"] });
    render(<HarmonicWheel />);
    // 4 bullets (label "Slot N color...")
    expect(screen.getAllByRole("button", { name: /^Slot \d color/ })).toHaveLength(4);
    // 4 dots (role=radio with "Slot N focal")
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("first dot starts as the focal (aria-checked=true), others false", () => {
    render(<HarmonicWheel />);
    const dots = screen.getAllByRole("radio");
    expect(dots[0]).toHaveAttribute("aria-checked", "true");
    expect(dots[1]).toHaveAttribute("aria-checked", "false");
    expect(dots[2]).toHaveAttribute("aria-checked", "false");
    expect(dots[3]).toHaveAttribute("aria-checked", "false");
  });

  it("clicking a different dot promotes that slot to focal", () => {
    render(<HarmonicWheel />);
    const dots = screen.getAllByRole("radio");
    fireEvent.click(dots[2]);
    expect(dots[2]).toHaveAttribute("aria-checked", "true");
    expect(dots[0]).toHaveAttribute("aria-checked", "false");
  });

  it("toggle on/off flips the store active mask", () => {
    render(<HarmonicWheel />);
    // Cada slot expone un botón "Disable slot N" cuando está activo
    const disableSlot2 = screen.getByRole("button", { name: "Disable slot 2" });
    fireEvent.click(disableSlot2);
    expect(useConfigStore.getState().active).toEqual([true, false, true, true]);
  });

  it("respects MIN_ACTIVE_COLORS=2 — disabling the third active slot is blocked", () => {
    useConfigStore.setState({ active: [true, true, false, false] });
    render(<HarmonicWheel />);
    const disableSlot1 = screen.getByRole("button", { name: "Disable slot 1" });
    fireEvent.click(disableSlot1);
    // Aún 2 activos (el botón está disabled, el click no hace nada)
    expect(useConfigStore.getState().active).toEqual([true, true, false, false]);
  });

  it("inactive slot exposes the Enable action", () => {
    useConfigStore.setState({ active: [true, false, true, true] });
    render(<HarmonicWheel />);
    fireEvent.click(screen.getByRole("button", { name: "Enable slot 2" }));
    expect(useConfigStore.getState().active).toEqual([true, true, true, true]);
  });

  it("renders the eyedropper button when window.EyeDropper exists", () => {
    render(<HarmonicWheel />);
    expect(
      screen.getByRole("button", { name: "Pick a color from anywhere on screen" }),
    ).toBeInTheDocument();
  });

  it("renders the light direction handle as a slider", () => {
    render(<HarmonicWheel />);
    const handle = screen.getByRole("slider", { name: "Light direction" });
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("aria-valuemin", "0");
    expect(handle).toHaveAttribute("aria-valuemax", "359");
  });

  it("dragging the focal bullet calls setColors with 4 hex values", () => {
    const spy = vi.spyOn(useConfigStore.getState(), "setColors");
    // Override store with the spy
    useConfigStore.setState({ setColors: spy });

    render(<HarmonicWheel />);
    const bullets = screen.getAllByRole("button", { name: /^Slot \d color/ });
    const focal = bullets[0];
    // Mock getBoundingClientRect del wheel area (no es trivial — el ref
    // apunta a un div interno). En jsdom rect = 0×0 por defecto. Para que
    // el drag genere una posición distinta, mockeamos clientX/Y a algo
    // arbitrario; el cálculo dará un offset ≠ 0 y disparará setColors.
    fireEvent.pointerDown(focal, { clientX: 100, clientY: 100, pointerId: 1 });
    expect(spy).toHaveBeenCalled();
    const calledWith = spy.mock.calls[0][0];
    expect(calledWith).toHaveLength(4);
    for (const c of calledWith as string[]) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
