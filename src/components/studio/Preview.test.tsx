import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("renders TWO canvases — the live wallpaper + the cross-fade overlay", () => {
    // The overlay holds the snapshot of the previous frame during the
    // cross-fade transition (ADR-0003 "anticipation > reveal"). It starts
    // hidden (opacity 0) and is aria-hidden so it never appears in a11y trees.
    render(<Preview />);
    const canvases = document.querySelectorAll("canvas");
    expect(canvases.length).toBe(2);
    const overlay = canvases[1];
    expect(overlay.getAttribute("aria-hidden")).toBe("true");
    expect(overlay.style.opacity).toBe("0");
  });

  afterEach(() => vi.restoreAllMocks());
});
