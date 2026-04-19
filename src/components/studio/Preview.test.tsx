import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Preview } from "./Preview";
import { useConfigStore } from "@/store/useConfigStore";
import { resetStores } from "@/test-utils";

describe("<Preview />", () => {
  beforeEach(resetStores);

  it("renders the 3 device pills with mobile active + the current resolution badge", () => {
    render(<Preview />);
    expect(screen.getByRole("button", { name: /mobile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tablet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /desktop/i })).toBeInTheDocument();
    // Initial mobile dim is 1440×3200
    expect(screen.getByText("1440 × 3200")).toBeInTheDocument();
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

  it("Download button shows 'Generating' during encode + returns to 'Download' after", async () => {
    render(<Preview />);
    const btn = screen.getByRole("button", { name: /download/i });
    fireEvent.click(btn);
    // The requestAnimationFrame + async pipeline resolves quickly with the mock
    // canvas.toBlob. Wait for the final state.
    await waitFor(() => expect(btn).not.toBeDisabled(), { timeout: 2000 });
    // After the download completes, the button's label reverts to Download.
    expect(btn.textContent).toMatch(/download/i);
  });

  it("renders a canvas (the wallpaper preview)", () => {
    render(<Preview />);
    const canvases = document.querySelectorAll("canvas");
    expect(canvases.length).toBeGreaterThanOrEqual(1);
  });

  it("Mockup toggle is only visible when device=mobile", () => {
    render(<Preview />);
    expect(screen.getByRole("button", { name: /mockup/i })).toBeInTheDocument();
    // Switching to desktop should hide the mockup button
    fireEvent.click(screen.getByRole("button", { name: /desktop/i }));
    expect(screen.queryByRole("button", { name: /mockup/i })).not.toBeInTheDocument();
  });

  it("Mockup toggle flips on click and renders dual iPhone chrome (big clock + Monday date)", () => {
    render(<Preview />);
    const mockup = screen.getByRole("button", { name: /mockup/i });
    fireEvent.click(mockup);
    expect(mockup).toHaveAttribute("aria-pressed", "true");
    // Lock chrome renders a large "9:41" time + date string
    expect(screen.getAllByText("9:41").length).toBeGreaterThanOrEqual(2); // status bar × 2 + lock clock
    expect(screen.getByText(/Monday/i)).toBeInTheDocument();
  });

  it("pressing Escape while Mockup is active closes it (a11y)", () => {
    render(<Preview />);
    const mockup = screen.getByRole("button", { name: /mockup/i });
    fireEvent.click(mockup);
    expect(mockup).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
  });

  it("Escape when Mockup is already closed does nothing (no crash)", () => {
    render(<Preview />);
    const mockup = screen.getByRole("button", { name: /mockup/i });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockup).toHaveAttribute("aria-pressed", "false");
  });

  afterEach(() => vi.restoreAllMocks());
});
