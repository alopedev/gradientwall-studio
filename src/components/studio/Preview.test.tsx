import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Preview } from "./Preview";
import { useConfigStore } from "@/store/useConfigStore";
import { resetStores } from "@/test-utils";
import * as downloadModule from "@/lib/download";
import type { Colors4 } from "@/lib/palettes";

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

  it("Random button randomizes the config (new seed at minimum)", () => {
    const before = useConfigStore.getState().seed;
    render(<Preview />);
    fireEvent.click(screen.getByRole("button", { name: /random/i }));
    expect(useConfigStore.getState().seed).not.toBe(before);
  });

  it("Download button shows 'Generating' during encode, then '✓ Saved' after, then reverts to 'Download'", async () => {
    render(<Preview />);
    const btn = screen.getByRole("button", { name: /download/i });
    fireEvent.click(btn);
    // The requestAnimationFrame + async pipeline resolves quickly with the mock
    // canvas.toBlob. Wait for the final state.
    await waitFor(() => expect(btn).not.toBeDisabled(), { timeout: 2000 });
    // Immediately after completion, the button shows a success flash.
    expect(btn.textContent).toMatch(/saved/i);
    // After ~1.6s the flash clears and the button returns to the default label.
    await waitFor(() => expect(btn.textContent).toMatch(/download/i), { timeout: 3000 });
  });

  it("renders a canvas (the wallpaper preview)", () => {
    render(<Preview />);
    const canvases = document.querySelectorAll("canvas");
    expect(canvases.length).toBeGreaterThanOrEqual(1);
  });

  it("Mockup toggle is only visible when device=mobile", () => {
    render(<Preview />);
    // Default is desktop — mockup button hidden
    expect(screen.queryByRole("button", { name: /mockup/i })).not.toBeInTheDocument();
    // Switch to mobile to reveal it
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    expect(screen.getByRole("button", { name: /mockup/i })).toBeInTheDocument();
    // Switching back to desktop hides the mockup button
    fireEvent.click(screen.getByRole("button", { name: /desktop/i }));
    expect(screen.queryByRole("button", { name: /mockup/i })).not.toBeInTheDocument();
  });

  it("Mockup toggle flips on click and renders dual iPhone chrome (big clock + Monday date)", async () => {
    render(<Preview />);
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    const mockup = screen.getByRole("button", { name: /mockup/i });
    fireEvent.click(mockup);
    expect(mockup).toHaveAttribute("aria-pressed", "true");
    // The stage cross-fades in under AnimatePresence mode="wait" — wait for
    // the chrome (lock clock "9:41" × ≥ 2 and Monday date) to reveal.
    await waitFor(() => expect(screen.getAllByText("9:41").length).toBeGreaterThanOrEqual(2), { timeout: 2000 });
    expect(screen.getByText(/Monday/i)).toBeInTheDocument();
  });

  it("pressing Escape while Mockup is active closes it (a11y)", () => {
    render(<Preview />);
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    const mockup = screen.getByRole("button", { name: /mockup/i });
    fireEvent.click(mockup);
    expect(mockup).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
  });

  it("Escape when Mockup is already closed does nothing (no crash)", () => {
    render(<Preview />);
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    const mockup = screen.getByRole("button", { name: /mockup/i });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
  });

  describe("active-mask filtering in the render pipeline", () => {
    it("Download passes the filtered ramp (only active slots) to downloadWallpaper", async () => {
      const spy = vi.spyOn(downloadModule, "downloadWallpaper").mockResolvedValue(undefined);
      useConfigStore.setState({
        colors: ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd"] as Colors4,
        active: [true, false, true, false],
      });

      render(<Preview />);
      fireEvent.click(screen.getByRole("button", { name: /download/i }));
      await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 2000 });

      const opts = spy.mock.calls[0][0];
      expect(opts.colors).toEqual(["#aaaaaa", "#cccccc"]);
    });

    it("Download uses all four colors when no slots are deactivated", async () => {
      const spy = vi.spyOn(downloadModule, "downloadWallpaper").mockResolvedValue(undefined);
      useConfigStore.setState({
        colors: ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd"] as Colors4,
        active: [true, true, true, true],
      });

      render(<Preview />);
      fireEvent.click(screen.getByRole("button", { name: /download/i }));
      await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 2000 });

      expect(spy.mock.calls[0][0].colors).toEqual(["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd"]);
    });
  });

  afterEach(() => vi.restoreAllMocks());
});
