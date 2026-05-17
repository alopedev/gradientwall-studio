import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HistoryDrawer } from "./HistoryDrawer";
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

describe("<HistoryDrawer />", () => {
  beforeEach(resetStores);

  it("renders a 'Saved' trigger with the current count", () => {
    useHistoryStore.setState({ history: [item(1), item(2)] });
    render(<HistoryDrawer />);
    const trigger = screen.getByRole("button", { name: /open saved gradients/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("2");
  });

  it("opening the drawer shows the empty state when history is empty", () => {
    render(<HistoryDrawer />);
    fireEvent.click(screen.getByRole("button", { name: /open saved gradients/i }));
    expect(screen.getByText(/NOTHING HERE YET/i)).toBeInTheDocument();
    expect(screen.getByText("0 saved")).toBeInTheDocument();
  });

  it("opening the drawer renders one card per history item", () => {
    useHistoryStore.setState({ history: [item(1), item(2), item(3)] });
    render(<HistoryDrawer />);
    fireEvent.click(screen.getByRole("button", { name: /open saved gradients/i }));
    expect(screen.queryByText(/NOTHING HERE YET/i)).not.toBeInTheDocument();
    expect(screen.getByText("3 saved")).toBeInTheDocument();
    const canvases = document.querySelectorAll("canvas");
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });

  it("clicking a card's delete button removes that item without loading it", () => {
    useHistoryStore.setState({ history: [item(1), item(2), item(3)] });
    render(<HistoryDrawer />);
    fireEvent.click(screen.getByRole("button", { name: /open saved gradients/i }));
    const deleteBtns = screen.getAllByRole("button", { name: /delete saved gradient/i });
    expect(deleteBtns).toHaveLength(3);
    const seedBefore = useConfigStore.getState().seed;
    fireEvent.click(deleteBtns[1]!);
    const remaining = useHistoryStore.getState().history;
    expect(remaining.map((h) => h.seed)).toEqual([1, 3]);
    expect(useConfigStore.getState().seed).toBe(seedBefore);
  });

  it("clicking a card loads it via the coordinator", () => {
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
    render(<HistoryDrawer />);
    fireEvent.click(screen.getByRole("button", { name: /open saved gradients/i }));
    // The card itself is the only button inside the drawer body that is not the delete pip.
    const cardButtons = screen
      .getAllByRole("button")
      .filter(
        (b) =>
          !/delete saved gradient/i.test(b.getAttribute("aria-label") ?? "") &&
          !/open saved gradients/i.test(b.getAttribute("aria-label") ?? "") &&
          !/close/i.test(b.getAttribute("aria-label") ?? ""),
      );
    fireEvent.click(cardButtons[0]!);
    const c = useConfigStore.getState();
    expect(c.style).toBe("liquid");
    expect(c.blur).toBe(90);
    expect(c.grain).toBe(10);
    expect(c.seed).toBe(777);
    expect(c.colors[0]).toBe("#aaaaaa");
  });
});
