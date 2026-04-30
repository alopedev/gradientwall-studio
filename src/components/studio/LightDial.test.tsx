import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LightDial } from "./LightDial";

// jsdom doesn't compute real geometry — we stub `getBoundingClientRect` so the
// dial can map cursor positions to angles deterministically.
function mountWithGeometry(value: number, onChange: (v: number) => void) {
  const utils = render(<LightDial value={value} onChange={onChange} />);
  const dial = screen.getByRole("slider", { name: /light direction/i });
  // 100×100 dial centered at (200, 200)
  vi.spyOn(dial, "getBoundingClientRect").mockReturnValue({
    left: 150,
    top: 150,
    right: 250,
    bottom: 250,
    width: 100,
    height: 100,
    x: 150,
    y: 150,
    toJSON: () => ({}),
  } as DOMRect);
  return { ...utils, dial };
}

describe("<LightDial />", () => {
  it("renders with the value reflected in aria-valuenow", () => {
    render(<LightDial value={135} onChange={() => {}} />);
    expect(screen.getByRole("slider", { name: /light direction/i })).toHaveAttribute("aria-valuenow", "135");
  });

  it("ArrowRight nudges the angle by 1°", () => {
    const onChange = vi.fn();
    render(<LightDial value={42} onChange={onChange} />);
    const dial = screen.getByRole("slider", { name: /light direction/i });
    fireEvent.keyDown(dial, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(43);
  });

  it("Shift+ArrowRight nudges by 5°", () => {
    const onChange = vi.fn();
    render(<LightDial value={42} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider", { name: /light direction/i }), {
      key: "ArrowRight",
      shiftKey: true,
    });
    expect(onChange).toHaveBeenCalledWith(47);
  });

  it("ArrowLeft from 0° wraps to 359°", () => {
    const onChange = vi.fn();
    render(<LightDial value={0} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider", { name: /light direction/i }), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith(359);
  });

  it("pointer down at the 12 o'clock position commits 0° (north)", () => {
    const onChange = vi.fn();
    const { dial } = mountWithGeometry(180, onChange);
    // 100×100 centered at (200, 200) — pointer at top edge: clientY = 150
    fireEvent.pointerDown(dial, { clientX: 200, clientY: 150 });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("pointer down at the 3 o'clock position commits 90° (east)", () => {
    const onChange = vi.fn();
    const { dial } = mountWithGeometry(0, onChange);
    fireEvent.pointerDown(dial, { clientX: 250, clientY: 200 });
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it("pointer down at the 6 o'clock position commits 180° (south)", () => {
    const onChange = vi.fn();
    const { dial } = mountWithGeometry(0, onChange);
    fireEvent.pointerDown(dial, { clientX: 200, clientY: 250 });
    expect(onChange).toHaveBeenCalledWith(180);
  });
});
