import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Swatches } from "./Swatches";
import { useConfigStore } from "@/store/useConfigStore";
import { resetStores } from "@/test-utils";

describe("<Swatches />", () => {
  beforeEach(resetStores);

  it("renders exactly 4 color inputs with the current colors and hex labels", () => {
    useConfigStore.setState({ colors: ["#112233", "#445566", "#778899", "#aabbcc"] });
    render(<Swatches />);
    const inputs = screen.getAllByDisplayValue(/^#[0-9a-f]{6}$/i);
    expect(inputs).toHaveLength(4);
    expect(screen.getByText("#112233")).toBeInTheDocument();
    expect(screen.getByText("#AABBCC")).toBeInTheDocument();
  });

  it("numbers the swatches 01..04", () => {
    render(<Swatches />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
  });

  it("updates the store when a color input changes, leaving siblings untouched", () => {
    useConfigStore.setState({ colors: ["#000000", "#111111", "#222222", "#333333"] });
    render(<Swatches />);
    const inputs = screen.getAllByDisplayValue(/^#[0-9a-f]{6}$/i);
    fireEvent.input(inputs[2], { target: { value: "#ff00ff" } });
    const next = useConfigStore.getState().colors;
    expect(next[0]).toBe("#000000");
    expect(next[1]).toBe("#111111");
    expect(next[2]).toBe("#ff00ff");
    expect(next[3]).toBe("#333333");
  });

  describe("per-slot deactivation", () => {
    it("exposes a toggle button for each swatch (labelled Deactivate/Activate color N)", () => {
      render(<Swatches />);
      for (let n = 1; n <= 4; n++) {
        // With all four active the button should offer the deactivate action.
        expect(screen.getByRole("button", { name: `Deactivate color ${n}` })).toBeInTheDocument();
      }
    });

    it("clicking the toggle on an active slot flips the store mask", () => {
      render(<Swatches />);
      fireEvent.click(screen.getByRole("button", { name: "Deactivate color 2" }));
      expect(useConfigStore.getState().active).toEqual([true, false, true, true]);
    });

    it("toggle button for an inactive slot offers the Activate action and re-enables", () => {
      useConfigStore.setState({ active: [true, false, true, true] });
      render(<Swatches />);
      fireEvent.click(screen.getByRole("button", { name: "Activate color 2" }));
      expect(useConfigStore.getState().active).toEqual([true, true, true, true]);
    });

    it("disables the toggle on active slots when only two remain active (minimum guard)", () => {
      useConfigStore.setState({ active: [true, false, true, false] });
      render(<Swatches />);
      // Slots 1 and 3 are the only two active — their Deactivate buttons must be disabled.
      expect(screen.getByRole("button", { name: "Deactivate color 1" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Deactivate color 3" })).toBeDisabled();
      // Inactive slots remain activatable.
      expect(screen.getByRole("button", { name: "Activate color 2" })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: "Activate color 4" })).not.toBeDisabled();
    });

    it("marks inactive swatches with data-active=false so CSS can dim them", () => {
      useConfigStore.setState({ active: [true, false, true, true] });
      render(<Swatches />);
      const labels = document.querySelectorAll("[data-slot-index]");
      expect(labels).toHaveLength(4);
      expect(labels[0].getAttribute("data-active")).toBe("true");
      expect(labels[1].getAttribute("data-active")).toBe("false");
      expect(labels[2].getAttribute("data-active")).toBe("true");
      expect(labels[3].getAttribute("data-active")).toBe("true");
    });
  });
});
