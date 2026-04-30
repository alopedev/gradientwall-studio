import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorHUD } from "./ColorHUD";
import { useUIStore } from "@/store/useUIStore";
import { resetStores } from "@/test-utils";

describe("<ColorHUD />", () => {
  beforeEach(resetStores);

  it("typing a valid hex calls onChange with the uppercased value and pushes to recents", () => {
    const onChange = vi.fn();
    render(<ColorHUD value="#ff0000" onChange={onChange} />);
    const hex = screen.getByDisplayValue("#FF0000");
    fireEvent.change(hex, { target: { value: "#00ff88" } });
    expect(onChange).toHaveBeenCalledWith("#00FF88");
    expect(useUIStore.getState().recentColors[0]).toBe("#00FF88");
  });

  it("typing an invalid hex draft does NOT call onChange (commit waits for valid pattern)", () => {
    const onChange = vi.fn();
    render(<ColorHUD value="#ff0000" onChange={onChange} />);
    const hex = screen.getByDisplayValue("#FF0000");
    fireEvent.change(hex, { target: { value: "#abc" } });
    fireEvent.change(hex, { target: { value: "#abcde" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("dragging an HSL slider with ArrowRight calls onChange with a new hex", () => {
    const onChange = vi.fn();
    render(<ColorHUD value="#ff0000" onChange={onChange} />);
    const sliders = screen.getAllByRole("slider");
    sliders[0]!.focus();
    fireEvent.keyDown(sliders[0]!, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0]![0] as string;
    expect(arg).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("renders Recents chips when the store has any", () => {
    useUIStore.setState({ recentColors: ["#AABBCC", "#112233"] });
    render(<ColorHUD value="#ff0000" onChange={() => {}} />);
    expect(screen.getByLabelText("Apply #AABBCC")).toBeInTheDocument();
    expect(screen.getByLabelText("Apply #112233")).toBeInTheDocument();
  });

  it("clicking a Recents chip applies that color via onChange", () => {
    const onChange = vi.fn();
    useUIStore.setState({ recentColors: ["#AABBCC"] });
    render(<ColorHUD value="#ff0000" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Apply #AABBCC"));
    expect(onChange).toHaveBeenCalledWith("#AABBCC");
  });
});
