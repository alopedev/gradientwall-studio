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
});
