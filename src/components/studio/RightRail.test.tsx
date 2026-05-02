import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RightRail } from "./RightRail";
import { useConfigStore } from "@/store/useConfigStore";
import { useUIStore } from "@/store/useUIStore";
import { resetStores } from "@/test-utils";

describe("<RightRail />", () => {
  beforeEach(resetStores);

  it("renders all three accordion sections (Source, Style, Effects)", () => {
    render(<RightRail />);
    expect(screen.getByRole("button", { name: /01\s*source/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /02\s*style/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /03\s*effects/i })).toBeInTheDocument();
  });

  it("starts in picker tab inside Source — switches to palettes on tab click", () => {
    render(<RightRail />);
    expect(screen.getByText("Four colors")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^palettes$/i }));
    expect(useUIStore.getState().activeTab).toBe("palettes");
    expect(screen.getByText("Curated")).toBeInTheDocument();
    expect(screen.queryByText("Four colors")).not.toBeInTheDocument();
  });

  it("clicking a style tab updates the config store", () => {
    render(<RightRail />);
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
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    expect(useConfigStore.getState().blur).toBe(before + 1);
  });

  it("nudging the grain slider with ArrowRight updates grain", async () => {
    const before = useConfigStore.getState().grain;
    render(<RightRail />);
    const sliders = screen.getAllByRole("slider");
    sliders[1]!.focus();
    fireEvent.keyDown(sliders[1]!, { key: "ArrowRight" });
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    expect(useConfigStore.getState().grain).toBe(before + 1);
  });

  describe("FROM IMAGE tab", () => {
    it("exposes a third Source tab labelled 'From image'", () => {
      render(<RightRail />);
      expect(screen.getByRole("button", { name: /^image$/i })).toBeInTheDocument();
    });

    it("switching to 'from image' hides the swatches/palettes UI and shows the upload affordance", () => {
      render(<RightRail />);
      fireEvent.click(screen.getByRole("button", { name: /^image$/i }));
      expect(useUIStore.getState().activeTab).toBe("image");
      expect(screen.queryByText("Four colors")).not.toBeInTheDocument();
      expect(screen.queryByText("Curated")).not.toBeInTheDocument();
      expect(screen.getByLabelText(/upload an image to extract/i)).toBeInTheDocument();
    });
  });

  describe("dynamic N-colors label", () => {
    it("shows 'Four colors' / 'mix · 4/4' when every slot is active", () => {
      render(<RightRail />);
      expect(screen.getByText("Four colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 4\/4/i)).toBeInTheDocument();
    });

    it("switches to 'Three colors' / 'mix · 3/4' when one slot is deactivated", () => {
      useConfigStore.setState({ active: [true, false, true, true] });
      render(<RightRail />);
      expect(screen.getByText("Three colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 3\/4/i)).toBeInTheDocument();
    });

    it("switches to 'Two colors' / 'mix · 2/4' when two slots are deactivated", () => {
      useConfigStore.setState({ active: [true, false, true, false] });
      render(<RightRail />);
      expect(screen.getByText("Two colors")).toBeInTheDocument();
      expect(screen.getByText(/mix · 2\/4/i)).toBeInTheDocument();
    });
  });
});
