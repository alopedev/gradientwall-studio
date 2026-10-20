import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLookHistoryStore } from "@/store/useLookHistoryStore";
import { resetStores } from "@/test-utils";
import { ShuffleToolbar } from "./ShuffleToolbar";

describe("ShuffleToolbar (‹ Shuffle › for the hero and the Studio)", () => {
  beforeEach(() => {
    resetStores();
    useLookHistoryStore.setState({ past: [], future: [] });
  });

  it("is one toolbar: previous, shuffle, next", () => {
    render(<ShuffleToolbar spins={0} onShuffle={vi.fn()} />);
    const bar = screen.getByRole("toolbar", { name: "Wallpaper controls" });
    expect([...bar.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual([
      "Previous wallpaper",
      "Shuffle: generate another wallpaper",
      "Next wallpaper",
    ]);
  });

  it("calls onShuffle with the shuffle button, so the Studio can start its reveal there", () => {
    const onShuffle = vi.fn();
    render(<ShuffleToolbar spins={0} onShuffle={onShuffle} />);
    const shuffle = screen.getByRole("button", { name: /shuffle/i });
    fireEvent.click(shuffle);
    expect(onShuffle).toHaveBeenCalledWith(shuffle);
  });

  it("disables an arrow at its end of the history and keeps it focusable", () => {
    const back = vi.spyOn(useLookHistoryStore.getState(), "back");
    const onStep = vi.fn();
    render(<ShuffleToolbar spins={0} onShuffle={vi.fn()} onStep={onStep} />);
    const prev = screen.getByRole("button", { name: "Previous wallpaper" });
    expect(prev).toHaveAttribute("aria-disabled", "true");
    expect(prev).not.toBeDisabled();
    fireEvent.click(prev);
    expect(back).not.toHaveBeenCalled();
    expect(onStep).not.toHaveBeenCalled();
  });

  it("steps through the history and tells the caller which arrow moved it", () => {
    const look = useLookHistoryStore.getState();
    const back = vi.fn();
    useLookHistoryStore.setState({ past: [{} as never], back });
    const onStep = vi.fn();
    render(<ShuffleToolbar spins={0} onShuffle={vi.fn()} onStep={onStep} />);
    const prev = screen.getByRole("button", { name: "Previous wallpaper" });
    expect(prev).toHaveAttribute("aria-disabled", "false");
    fireEvent.click(prev);
    expect(onStep).toHaveBeenCalledWith(prev);
    expect(back).toHaveBeenCalledOnce();
    useLookHistoryStore.setState({ back: look.back });
  });
});
