import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ControlsPanel } from "./ControlsPanel";
import { useConfigStore } from "@/store/useConfigStore";
import { useUIStore } from "@/store/useUIStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { resetStores } from "@/test-utils";

describe("<ControlsPanel />", () => {
  beforeEach(resetStores);

  it("renders the Source heading + picker/palettes tabs + style tabs + both sliders + action buttons", () => {
    render(<ControlsPanel />);
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /color picker/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^palettes$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "mesh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "blobs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "liquid" })).toBeInTheDocument();
    expect(screen.getByText(/softness/i)).toBeInTheDocument();
    expect(screen.getByText(/^grain$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reshuffle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save to history/i })).toBeInTheDocument();
  });

  it("starts in picker tab (swatches visible), switches to palettes on tab click", () => {
    render(<ControlsPanel />);
    expect(screen.getByText("Four colors")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^palettes$/i }));
    expect(useUIStore.getState().activeTab).toBe("palettes");
    expect(screen.getByText("Curated")).toBeInTheDocument();
    expect(screen.queryByText("Four colors")).not.toBeInTheDocument();
  });

  it("clicking a style tab updates the config store", () => {
    render(<ControlsPanel />);
    fireEvent.click(screen.getByRole("button", { name: "blobs" }));
    expect(useConfigStore.getState().style).toBe("blobs");
    fireEvent.click(screen.getByRole("button", { name: "liquid" }));
    expect(useConfigStore.getState().style).toBe("liquid");
  });

  it("dragging the softness slider updates blur", () => {
    render(<ControlsPanel />);
    const sliders = screen.getAllByRole("slider") as HTMLInputElement[];
    const softness = sliders[0]; // first slider in the panel
    fireEvent.input(softness, { target: { value: "72" } });
    expect(useConfigStore.getState().blur).toBe(72);
  });

  it("dragging the grain slider updates grain", () => {
    render(<ControlsPanel />);
    const sliders = screen.getAllByRole("slider") as HTMLInputElement[];
    const grain = sliders[1];
    fireEvent.input(grain, { target: { value: "12" } });
    expect(useConfigStore.getState().grain).toBe(12);
  });

  it("Reshuffle produces a different seed", () => {
    const before = useConfigStore.getState().seed;
    render(<ControlsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /reshuffle/i }));
    expect(useConfigStore.getState().seed).not.toBe(before);
  });

  it("Save to history appends the current config to the history store", () => {
    useConfigStore.setState({ style: "blobs", blur: 30, grain: 20, seed: 4242 });
    render(<ControlsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /save to history/i }));
    const history = useHistoryStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ style: "blobs", blur: 30, grain: 20, seed: 4242 });
  });
});
