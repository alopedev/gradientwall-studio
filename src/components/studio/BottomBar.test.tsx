import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BottomBar } from "./BottomBar";
import { useConfigStore } from "@/store/useConfigStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { resetStores } from "@/test-utils";
import * as downloadModule from "@/lib/download";
import type { Colors4 } from "@/lib/palettes";

describe("<BottomBar />", () => {
  beforeEach(resetStores);
  afterEach(() => vi.restoreAllMocks());

  it("renders the seed badge, reshuffle, save and download actions", () => {
    render(<BottomBar />);
    expect(screen.getByRole("button", { name: /edit seed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reshuffle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });

  it("clicking Reshuffle produces a different seed", () => {
    const before = useConfigStore.getState().seed;
    render(<BottomBar />);
    fireEvent.click(screen.getByRole("button", { name: /reshuffle/i }));
    expect(useConfigStore.getState().seed).not.toBe(before);
  });

  it("clicking Save appends the current config to the history store", () => {
    useConfigStore.setState({ style: "liquid", blur: 30, grain: 20, seed: 4242 });
    render(<BottomBar />);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    const history = useHistoryStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ style: "liquid", blur: 30, grain: 20, seed: 4242 });
  });

  it("Download button shows 'Generating' then '✓ Saved' then reverts to 'Download'", async () => {
    render(<BottomBar />);
    const btn = screen.getByRole("button", { name: /download/i });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).not.toBeDisabled(), { timeout: 2000 });
    expect(btn.textContent).toMatch(/saved/i);
    await waitFor(() => expect(btn.textContent).toMatch(/download/i), { timeout: 3000 });
  });

  describe("active-mask filtering in the download pipeline", () => {
    it("Download passes the filtered ramp (only active slots) to downloadWallpaper", async () => {
      const spy = vi.spyOn(downloadModule, "downloadWallpaper").mockResolvedValue(undefined);
      useConfigStore.setState({
        colors: ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd"] as Colors4,
        active: [true, false, true, false],
      });
      render(<BottomBar />);
      fireEvent.click(screen.getByRole("button", { name: /download/i }));
      await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 2000 });
      expect(spy.mock.calls[0]![0].colors).toEqual(["#aaaaaa", "#cccccc"]);
    });

    it("Download uses all four colors when no slots are deactivated", async () => {
      const spy = vi.spyOn(downloadModule, "downloadWallpaper").mockResolvedValue(undefined);
      useConfigStore.setState({
        colors: ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd"] as Colors4,
        active: [true, true, true, true],
      });
      render(<BottomBar />);
      fireEvent.click(screen.getByRole("button", { name: /download/i }));
      await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 2000 });
      expect(spy.mock.calls[0]![0].colors).toEqual(["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd"]);
    });
  });
});
