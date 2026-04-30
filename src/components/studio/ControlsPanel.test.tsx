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
    expect(screen.getByText(/01 · source/i)).toBeInTheDocument();
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

  it("nudging the softness slider with ArrowRight updates blur", () => {
    const before = useConfigStore.getState().blur;
    render(<ControlsPanel />);
    const sliders = screen.getAllByRole("slider");
    const softness = sliders[0]!;
    softness.focus();
    fireEvent.keyDown(softness, { key: "ArrowRight" });
    expect(useConfigStore.getState().blur).toBe(before + 1);
  });

  it("nudging the grain slider with ArrowRight updates grain", () => {
    const before = useConfigStore.getState().grain;
    render(<ControlsPanel />);
    const sliders = screen.getAllByRole("slider");
    const grain = sliders[1]!;
    grain.focus();
    fireEvent.keyDown(grain, { key: "ArrowRight" });
    expect(useConfigStore.getState().grain).toBe(before + 1);
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

  describe("FROM IMAGE tab", () => {
    it("exposes a third Source tab labelled 'From image'", () => {
      render(<ControlsPanel />);
      expect(screen.getByRole("button", { name: /from image/i })).toBeInTheDocument();
    });

    it("switching to 'from image' hides the swatches/palettes UI and shows the upload affordance", () => {
      render(<ControlsPanel />);
      fireEvent.click(screen.getByRole("button", { name: /from image/i }));
      expect(useUIStore.getState().activeTab).toBe("image");
      // The swatches grid (Four colors label) and the curated list (Curated) are both gone.
      expect(screen.queryByText("Four colors")).not.toBeInTheDocument();
      expect(screen.queryByText("Curated")).not.toBeInTheDocument();
      expect(screen.getByLabelText(/upload an image to extract/i)).toBeInTheDocument();
    });
  });

  describe("dynamic N-colors label", () => {
    it("shows 'Four colors' / 'mix · 4/4' when every slot is active", () => {
      render(<ControlsPanel />);
      expect(screen.getByText("Four colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 4\/4/i)).toBeInTheDocument();
    });

    it("switches to 'Three colors' / 'mix · 3/4' when one slot is deactivated", () => {
      useConfigStore.setState({ active: [true, false, true, true] });
      render(<ControlsPanel />);
      expect(screen.getByText("Three colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 3\/4/i)).toBeInTheDocument();
    });

    it("switches to 'Two colors' / 'mix · 2/4' when two slots are deactivated", () => {
      useConfigStore.setState({ active: [true, false, true, false] });
      render(<ControlsPanel />);
      expect(screen.getByText("Two colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 2\/4/i)).toBeInTheDocument();
    });
  });
});
