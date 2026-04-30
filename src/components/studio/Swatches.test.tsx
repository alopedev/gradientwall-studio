import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Swatches } from "./Swatches";
import { useConfigStore } from "@/store/useConfigStore";
import { resetStores } from "@/test-utils";

describe("<Swatches />", () => {
  beforeEach(resetStores);

  it("renders exactly 4 active color cells, each labelled with its uppercased hex", () => {
    useConfigStore.setState({ colors: ["#112233", "#445566", "#778899", "#aabbcc"] });
    render(<Swatches />);
    expect(screen.getByText("#112233")).toBeInTheDocument();
    expect(screen.getByText("#445566")).toBeInTheDocument();
    expect(screen.getByText("#778899")).toBeInTheDocument();
    expect(screen.getByText("#AABBCC")).toBeInTheDocument();
    // Each active cell exposes an "Edit color N" trigger that opens the HUD.
    expect(screen.getAllByRole("button", { name: /^Edit color \d$/ })).toHaveLength(4);
  });

  it("numbers the swatches 01..04", () => {
    render(<Swatches />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
  });

  describe("per-slot deactivation", () => {
    it("exposes a toggle button for each swatch (labelled Deactivate/Activate color N)", () => {
      render(<Swatches />);
      for (let n = 1; n <= 4; n++) {
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
      expect(screen.getByRole("button", { name: "Deactivate color 1" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Deactivate color 3" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Activate color 2" })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: "Activate color 4" })).not.toBeDisabled();
    });

    it("marks inactive swatches with data-active=false so CSS can dim them", () => {
      useConfigStore.setState({ active: [true, false, true, true] });
      render(<Swatches />);
      const labels = document.querySelectorAll("[data-slot-index]");
      expect(labels).toHaveLength(4);
      expect(labels[0]!.getAttribute("data-active")).toBe("true");
      expect(labels[1]!.getAttribute("data-active")).toBe("false");
      expect(labels[2]!.getAttribute("data-active")).toBe("true");
      expect(labels[3]!.getAttribute("data-active")).toBe("true");
    });
  });
});
