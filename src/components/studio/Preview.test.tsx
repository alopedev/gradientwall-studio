import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Preview } from "./Preview";
import { useConfigStore } from "@/store/useConfigStore";
import { resetStores } from "@/test-utils";

describe("<Preview />", () => {
  beforeEach(resetStores);

  it("renders the 3 device pills with desktop active + the current resolution badge", () => {
    render(<Preview />);
    expect(screen.getByRole("button", { name: /mobile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tablet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /desktop/i })).toBeInTheDocument();
    // Initial desktop dim is 5120×2880
    expect(screen.getByText("5120 × 2880")).toBeInTheDocument();
  });

  it("clicking a device pill updates the config store + the info badge", () => {
    render(<Preview />);
    fireEvent.click(screen.getByRole("button", { name: /desktop/i }));
    expect(useConfigStore.getState().device).toBe("desktop");
    expect(screen.getByText("5120 × 2880")).toBeInTheDocument();
  });

  it("renders a canvas (the wallpaper preview)", () => {
    render(<Preview />);
    const canvases = document.querySelectorAll("canvas");
    expect(canvases.length).toBeGreaterThanOrEqual(1);
  });

  it("Mockup toggle is only visible when device=mobile", () => {
    render(<Preview />);
    // Default is desktop — mockup button hidden
    expect(screen.queryByRole("button", { name: /preview inside iphone frame/i })).not.toBeInTheDocument();
    // Switch to mobile to reveal it
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    expect(screen.getByRole("button", { name: /preview inside iphone frame/i })).toBeInTheDocument();
    // Switching back to desktop hides the mockup button
    fireEvent.click(screen.getByRole("button", { name: /desktop/i }));
    expect(screen.queryByRole("button", { name: /preview inside iphone frame/i })).not.toBeInTheDocument();
  });

  it("Mockup toggle flips on click and reveals the iPhone mockup img", async () => {
    render(<Preview />);
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    const mockup = screen.getByRole("button", { name: /preview inside iphone frame/i });
    fireEvent.click(mockup);
    expect(mockup).toHaveAttribute("aria-pressed", "true");
    // The stage cross-fades in under AnimatePresence mode="wait" — wait for
    // the photographic frame asset to appear.
    await waitFor(
      () => expect(document.querySelector('img[src*="iPhoneMockup"]')).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("pressing Escape while Mockup is active closes it (a11y)", () => {
    render(<Preview />);
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    const mockup = screen.getByRole("button", { name: /preview inside iphone frame/i });
    fireEvent.click(mockup);
    expect(mockup).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
  });

  it("Escape when Mockup is already closed does nothing (no crash)", () => {
    render(<Preview />);
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    const mockup = screen.getByRole("button", { name: /preview inside iphone frame/i });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
  });

  afterEach(() => vi.restoreAllMocks());
});
