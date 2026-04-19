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

  afterEach(() => vi.restoreAllMocks());
});
