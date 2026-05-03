import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RightRail } from "./RightRail";
import { useConfigStore } from "@/store/useConfigStore";
import { useUIStore } from "@/store/useUIStore";
import { resetStores, flushRaf } from "@/test-utils";

describe("<RightRail />", () => {
  beforeEach(resetStores);

  it("renders all three accordion sections (Source, Style, Effects) — all open by default", () => {
    render(<RightRail />);
    const sourceTrigger = screen.getByRole("button", { name: /01\s*source/i });
    const styleTrigger = screen.getByRole("button", { name: /02\s*style/i });
    const effectsTrigger = screen.getByRole("button", { name: /03\s*effects/i });
    expect(sourceTrigger).toHaveAttribute("aria-expanded", "true");
    expect(styleTrigger).toHaveAttribute("aria-expanded", "true");
    expect(effectsTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it("starts in palettes tab inside Source — switches to picker on tab click", () => {
    render(<RightRail />);
    expect(screen.getByText("Curated")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^picker$/i }));
    expect(useUIStore.getState().activeTab).toBe("picker");
    expect(screen.getByText("Four colors")).toBeInTheDocument();
    expect(screen.queryByText("Curated")).not.toBeInTheDocument();
  });

  it("clicking a style tab updates the config store", () => {
    render(<RightRail />);
    // All accordion sections start open under the multi-open layout, so
    // Style's pills are immediately reachable — no extra click to expand.
    fireEvent.click(screen.getByRole("button", { name: "blobs" }));
    expect(useConfigStore.getState().style).toBe("blobs");
    fireEvent.click(screen.getByRole("button", { name: "liquid" }));
    expect(useConfigStore.getState().style).toBe("liquid");
  });

  it("nudging the softness slider with ArrowRight updates blur", async () => {
    const before = useConfigStore.getState().blur;
    render(<RightRail />);
    const sliders = screen.getAllByRole("slider");
    sliders[0]!.focus();
    fireEvent.keyDown(sliders[0]!, { key: "ArrowRight" });
    // setBlur is rAF-batched (slider-drag perf); wait one frame for the flush.
    await flushRaf();
    expect(useConfigStore.getState().blur).toBe(before + 1);
  });

  it("nudging the grain slider with ArrowRight updates grain", async () => {
    const before = useConfigStore.getState().grain;
    render(<RightRail />);
    const sliders = screen.getAllByRole("slider");
    sliders[1]!.focus();
    fireEvent.keyDown(sliders[1]!, { key: "ArrowRight" });
    await flushRaf();
    expect(useConfigStore.getState().grain).toBe(before + 1);
  });

  describe("Source tab — Use my photo button", () => {
    it("exposes only two Source tabs (Palettes + Picker)", () => {
      render(<RightRail />);
      expect(screen.getByRole("button", { name: /^palettes$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^picker$/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^image$/i })).not.toBeInTheDocument();
    });

    it("inside the Picker tab, exposes a 'Use my photo' button", () => {
      useUIStore.setState({ activeTab: "picker" });
      render(<RightRail />);
      expect(screen.getByRole("button", { name: /use my photo/i })).toBeInTheDocument();
    });
  });

  describe("dynamic N-colors label", () => {
    // The N-colors label only renders inside the Picker source tab. Tests
    // pre-set activeTab so they don't depend on which tab the studio opens
    // with by default (palettes since the May 2026 reorder).
    it("shows 'Four colors' / 'mix · 4/4' when every slot is active", () => {
      useUIStore.setState({ activeTab: "picker" });
      render(<RightRail />);
      expect(screen.getByText("Four colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 4\/4/i)).toBeInTheDocument();
    });

    it("switches to 'Three colors' / 'mix · 3/4' when one slot is deactivated", () => {
      useUIStore.setState({ activeTab: "picker" });
      useConfigStore.setState({ active: [true, false, true, true] });
      render(<RightRail />);
      expect(screen.getByText("Three colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 3\/4/i)).toBeInTheDocument();
    });

    it("switches to 'Two colors' / 'mix · 2/4' when two slots are deactivated", () => {
      useUIStore.setState({ activeTab: "picker" });
      useConfigStore.setState({ active: [true, false, true, false] });
      render(<RightRail />);
      expect(screen.getByText("Two colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 2\/4/i)).toBeInTheDocument();
    });
  });
});
