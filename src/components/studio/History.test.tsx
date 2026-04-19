import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { History } from "./History";
import { useConfigStore } from "@/store/useConfigStore";
import { useHistoryStore, type HistoryItem } from "@/store/useHistoryStore";
import { resetStores } from "@/test-utils";

const item = (seed: number): HistoryItem => ({
  colors: ["#111111", "#222222", "#333333", "#444444"],
  style: "mesh",
  blur: 48,
  grain: 45,
  seed,
});

describe("<History />", () => {
  beforeEach(resetStores);

  it("shows the empty state when history is empty", () => {
    render(<History />);
    expect(screen.getByText(/NOTHING HERE YET/i)).toBeInTheDocument();
    expect(screen.getByText("0 saved")).toBeInTheDocument();
  });

  it("renders one card per history item and shows count", () => {
    useHistoryStore.setState({ history: [item(1), item(2), item(3)] });
    render(<History />);
    expect(screen.queryByText(/NOTHING HERE YET/i)).not.toBeInTheDocument();
    expect(screen.getByText("3 saved")).toBeInTheDocument();
    const canvases = document.querySelectorAll("#gradientwall-history canvas, canvas");
    // 3 history cards each render a canvas
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });

  it("clicking a card calls loadHistoryItem → config store picks up item's values", () => {
    useHistoryStore.setState({
      history: [
        {
          colors: ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd"],
          style: "liquid",
          blur: 90,
          grain: 10,
          seed: 777,
        },
      ],
    });
    render(<History />);
    // The card is a <button> wrapping the canvas. Find it via role.
    const btn = screen.getAllByRole("button")[0];
    fireEvent.click(btn);
    const c = useConfigStore.getState();
    expect(c.style).toBe("liquid");
    expect(c.blur).toBe(90);
    expect(c.grain).toBe(10);
    expect(c.seed).toBe(777);
    expect(c.colors[0]).toBe("#aaaaaa");
  });
});
